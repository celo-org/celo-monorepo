import chalk from 'chalk'
import { spawn, SpawnOptions } from 'child_process'
import fs from 'fs-extra'
import ganache from 'ganache'
import path from 'path'
import targz from 'targz'
import tmp from 'tmp'
import yargs from 'yargs'

tmp.setGracefulCleanup()

const MNEMONIC = 'concert load couple harbor equip island argue ramp clarify fence smart topic'

const gasLimit = 20000000

const ProtocolRoot = path.normalize(path.join(__dirname, '../'))

// As documented https://circleci.com/docs/2.0/env-vars/#built-in-environment-variables
const isCI = process.env.CI === 'true'

// Move to where the caller made the call So to have relative paths
const CallerCWD = process.env.INIT_CWD ? process.env.INIT_CWD : process.cwd()
process.chdir(CallerCWD)

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
yargs
  .scriptName('devchain')
  .recommendCommands()
  .demandCommand(1)
  .strict(true)
  .showHelpOnFail(true)
  .command(
    'run <datadir>',
    "Run celo's devchain using given datadir without copying it",
    (args) =>
      args
        .positional('datadir', { type: 'string', description: 'Data Dir' })
        .option('reset', {
          type: 'boolean',
          description: 'Start fresh if enabled',
        })
        .option('upto', {
          type: 'number',
          description: 'When reset, run upto given migration',
        }),
    (args) =>
      exitOnError(runDevChain(args.datadir, { reset: args.reset, upto: args.upto, targz: false }))
  )
  .command(
    'run-tar <filename>',
    "Run celo's devchain using given tar filename. Generates a copy and then delete it",
    (args) => args.positional('filename', { type: 'string', description: 'Chain tar filename' }),
    (args) => exitOnError(runDevChainFromTar(args.filename))
  )
  .command(
    'run-tar-in-bg <filename>',
    "Run celo's devchain using given tar filename. Generates a copy and then delete it",
    (args) => args.positional('filename', { type: 'string', description: 'Chain tar filename' }),
    (args) => exitOnError(runDevChainFromTarInBackGround(args.filename))
  )
  .command(
    'generate <datadir>',
    'Create a new devchain directory from scratch',
    (args) =>
      args
        .positional('datadir', { type: 'string', description: 'Data Dir' })
        .option('upto', {
          type: 'number',
          description: 'When reset, run upto given migration',
        })
        .option('migration_override', {
          type: 'string',
          description: 'Path to JSON containing config values to use in migrations',
        }),
    (args) =>
      exitOnError(
        generateDevChain(args.datadir, {
          upto: args.upto,
          migrationOverride: args.migration_override,
          targz: false,
        })
      )
  )
  .command(
    'generate-tar <filename>',
    'Create a new devchain.tar.gz from scratch',
    (args) =>
      args
        .positional('filename', { type: 'string', description: 'chain tar filename' })
        .option('upto', {
          type: 'number',
          description: 'When reset, run upto given migration',
        })
        .option('migration_override', {
          type: 'string',
          description: 'Path to JSON containing config values to use in migrations',
        })
        .option('release_gold_contracts', {
          type: 'string',
          description: 'Path to JSON containing list of release gold contracts',
        }),
    (args) =>
      exitOnError(
        generateDevChain(args.filename, {
          upto: args.upto,
          migrationOverride: args.migration_override,
          releaseGoldContracts: args.release_gold_contracts,
          targz: true,
        })
      )
  )
  .command(
    'compress-chain <datadir> <filename>',
    'Create a devchain.tar.gz from specified datadir',
    (args) =>
      args
        .positional('datadir', { type: 'string', description: 'datadir path' })
        .positional('filename', { type: 'string', description: 'chain tar filename' }),
    (args) => exitOnError(compressChain(args.datadir, args.filename))
  ).argv

function startGanache(datadir: string, opts: { verbose?: boolean }, chainCopy?: tmp.DirResult) {
  const logFn = opts.verbose
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      (...args: any[]) => console.info(...args)
    : () => {
        /* nothing */
      }

  const server = ganache.server({
    logging: { logger: { log: logFn } },
    database: { dbPath: datadir },
    wallet: { mnemonic: MNEMONIC, defaultBalance: 200000000 },
    miner: { blockGasLimit: gasLimit },
    chain: { networkId: 1101, chainId: 1, allowUnlimitedContractSize: true },
    allowUnlimitedInitCodeSize: true,
  })

  server.listen(8545, (err) => {
    if (err) {
      throw err
    }
    // eslint-disable-next-line: no-console
    console.info(chalk.red('Ganache STARTED'))
  })

  return async () => {
    await server.close()
    if (chainCopy) {
      chainCopy.removeCallback()
    }
    console.info(chalk.red('Ganache server CLOSED'))
  }
}

export function execCmd(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  return new Promise<number>((resolve, reject) => {
    const { silent, ...spawnOptions } = options || { silent: false }
    if (!silent) {
      console.debug('$ ' + [cmd].concat(args).join(' '))
    }
    const process = spawn(cmd, args, {
      ...spawnOptions,
      stdio: silent ? 'ignore' : 'inherit',
    })
    process.on('close', (code) => {
      try {
        resolve(code)
      } catch (error) {
        reject(error)
      }
    })
  })
}

function exitOnError(p: Promise<unknown>) {
  p.catch((err) => {
    console.error(`Command Failed`)
    console.error(err)
    process.exit(1)
  })
}

async function resetDir(dir: string, silent?: boolean) {
  if (fs.existsSync(dir)) {
    await execCmd('rm', ['-rf', dir], { silent })
  }
}
function createDirIfMissing(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

function runMigrations(opts: { upto?: number; migrationOverride?: string } = {}) {
  const cmdArgs = ['truffle', 'migrate', '--reset', '--network', 'development']

  if (opts.upto) {
    cmdArgs.push('--to')
    cmdArgs.push(opts.upto.toString())
  }

  if (opts.migrationOverride) {
    cmdArgs.push('--migration_override')
    const file: string = fs.readFileSync(opts.migrationOverride).toString()
    cmdArgs.push(file)
  }
  return execCmd(`yarn`, cmdArgs, { cwd: ProtocolRoot })
}

function deployReleaseGold(releaseGoldContracts: string) {
  const cmdArgs = ['truffle', 'exec', 'scripts/truffle/deploy_release_contracts.js']
  cmdArgs.push('--network')
  // TODO(lucas): investigate if this can be found dynamically
  cmdArgs.push('development')
  cmdArgs.push('--from')
  cmdArgs.push('0x5409ED021D9299bf6814279A6A1411A7e866A631')
  cmdArgs.push('--grants')
  cmdArgs.push(releaseGoldContracts)
  cmdArgs.push('--start_gold')
  cmdArgs.push('1')
  cmdArgs.push('--deployed_grants')
  // Random file name to prevent rewriting to it
  cmdArgs.push('/tmp/deployedGrants' + Math.floor(1000 * Math.random()) + '.json')
  cmdArgs.push('--output_file')
  cmdArgs.push('/tmp/releaseGoldOutput.txt')
  // --yesreally command to bypass prompts
  cmdArgs.push('--yesreally')
  cmdArgs.push('--build_directory')
  cmdArgs.push(ProtocolRoot + 'build')

  return execCmd(`yarn`, cmdArgs, { cwd: ProtocolRoot })
}

async function runDevChainFromTar(filename: string) {
  const chainCopy: tmp.DirResult = tmp.dirSync({ keep: false, unsafeCleanup: true })
  // eslint-disable-next-line: no-console
  console.info(`Creating tmp folder: ${chainCopy.name}`)

  await decompressChain(filename, chainCopy.name)

  console.info('Starting Ganache ...')
  const stopGanache = startGanache(chainCopy.name, { verbose: true }, chainCopy)
  if (isCI) {
    // If we are running on circle ci we need to wait for ganache to be up.
    await waitForPortOpen('localhost', 8545, 120)
  }

  return stopGanache
}

/// This function was created to replace `startInBgAndWaitForString` in `release-on-devchain.sh`
/// and intended to be run on a hosted instances that shutdown after execution.
/// Note: If you run this locally, you will need to properly cleanup tmp.DirResult and
/// manually close the detached ganache instance.
/// see https://trufflesuite.com/docs/ganache/reference/cli-options/#manage-detached-instances for more details
async function runDevChainFromTarInBackGround(filename: string) {
  const cmdArgs = ['ganache-devchain', '-d']

  // keep is set to true, because `release-on-devchain` fails when set to false.
  const chainCopy: tmp.DirResult = tmp.dirSync({ keep: true, unsafeCleanup: true })

  // eslint-disable-next-line: no-console
  console.info(`Creating tmp folder: ${chainCopy.name}`)

  await decompressChain(filename, chainCopy.name)

  cmdArgs.push(chainCopy.name)

  return execCmd(`yarn`, cmdArgs, { cwd: ProtocolRoot })
}

function decompressChain(tarPath: string, copyChainPath: string): Promise<void> {
  // eslint-disable-next-line: no-console
  console.info('Decompressing chain')
  return new Promise((resolve, reject) => {
    targz.decompress({ src: tarPath, dest: copyChainPath }, (err) => {
      if (err) {
        console.error(err)
        reject(err)
      } else {
        // eslint-disable-next-line: no-console
        console.info('Chain decompressed')
        resolve()
      }
    })
  })
}

async function runDevChain(
  datadir: string,
  opts: {
    reset?: boolean
    upto?: number
    migrationOverride?: string
    targz?: boolean
    runMigrations?: boolean
    releaseGoldContracts?: string
  } = {}
) {
  if (opts.reset) {
    await resetDir(datadir)
  }
  createDirIfMissing(datadir)
  console.info('Starting Ganache ...')
  const stopGanache = startGanache(datadir, { verbose: true })
  if (isCI) {
    // If we are running on circle ci we need to wait for ganache to be up.
    await waitForPortOpen('localhost', 8545, 120)
  }
  if (opts.reset || opts.runMigrations) {
    const code = await runMigrations({ upto: opts.upto, migrationOverride: opts.migrationOverride })
    if (code !== 0) {
      throw Error('Migrations failed')
    }
    console.info('Migrations successfully applied')
  }
  if (opts.releaseGoldContracts) {
    const code = await deployReleaseGold(opts.releaseGoldContracts)
    if (code !== 0) {
      throw Error('ReleaseGold deployment failed')
    }
    console.info('ReleaseGold successfully deployed')
  }
  return stopGanache
}

async function generateDevChain(
  filePath: string,
  opts: {
    upto?: number
    migrationOverride?: string
    releaseGoldContracts?: string
    targz?: boolean
  } = {}
) {
  let chainPath = filePath
  let chainTmp: tmp.DirResult
  if (opts.targz) {
    chainTmp = tmp.dirSync({ keep: false, unsafeCleanup: true })
    chainPath = chainTmp.name
  } else {
    fs.ensureDirSync(chainPath)
  }
  const stopGanache = await runDevChain(chainPath, {
    reset: !opts.targz,
    runMigrations: true,
    upto: opts.upto,
    migrationOverride: opts.migrationOverride,
    releaseGoldContracts: opts.releaseGoldContracts,
  })
  await stopGanache()
  if (opts.targz && chainTmp) {
    await compressChain(chainPath, filePath)
    chainTmp.removeCallback()
  }
}

async function compressChain(chainPath: string, filename: string): Promise<void> {
  // eslint-disable-next-line: no-console
  console.info('Compressing chain')
  return new Promise((resolve, reject) => {
    // ensures the path to the file
    fs.ensureFileSync(filename)
    targz.compress({ src: chainPath, dest: filename }, (err: Error) => {
      if (err) {
        console.error(err)
        reject(err)
      } else {
        // eslint-disable-next-line: no-console
        console.info('Chain compressed')
        resolve()
      }
    })
  })
}

export async function waitForPortOpen(host: string, port: number, seconds: number) {
  console.info(`Waiting for ${host}:${port} to open for ${seconds}s`)
  const deadline = Date.now() + seconds * 1000
  do {
    if (await isPortOpen(host, port)) {
      await delay(10000) // extra 10s just to give ganache extra time to startup
      console.info(`Port ${host}:${port} opened`)
      return true
    }
  } while (Date.now() < deadline)
  console.info('Port was not opened in time')
  return false
}

async function isPortOpen(host: string, port: number) {
  return (await execCmd('nc', ['-z', host, port.toString()], { silent: true })) === 0
}

function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
