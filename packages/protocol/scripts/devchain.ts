import * as ganache from '@celo/ganache-cli'
import chalk from 'chalk'
import { spawn, SpawnOptions } from 'child_process'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as targz from 'targz'
import * as tmp from 'tmp'
import * as yargs from 'yargs'

tmp.setGracefulCleanup()

const MNEMONIC = 'concert load couple harbor equip island argue ramp clarify fence smart topic'

const gasLimit = 20000000

const ProtocolRoot = path.normalize(path.join(__dirname, '../'))

// Move to where the caller made the call So to have relative paths
const CallerCWD = process.env.INIT_CWD ? process.env.INIT_CWD : process.cwd()
process.chdir(CallerCWD)

// tslint:disable-next-line: no-unused-expression
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
          description: 'JSON list of release gold contracts',
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
  ).argv

async function startGanache(
  datadir: string,
  opts: { verbose?: boolean },
  chainCopy?: tmp.DirResult
) {
  const logFn = opts.verbose
    ? // tslint:disable-next-line: no-console
      (...args: any[]) => console.log(...args)
    : () => {
        /*nothing*/
      }

  const server = ganache.server({
    default_balance_ether: 200000000,
    logger: {
      log: logFn,
    },
    network_id: 1101,
    db_path: datadir,
    mnemonic: MNEMONIC,
    gasLimit,
    allowUnlimitedContractSize: true,
  })

  await new Promise((resolve, reject) => {
    server.listen(8545, (err, blockchain) => {
      if (err) {
        reject(err)
      } else {
        // tslint:disable-next-line: no-console
        console.log(chalk.red('Ganache STARTED'))
        // console.log(blockchain)
        resolve(blockchain)
      }
    })
  })

  return () =>
    new Promise((resolve, reject) => {
      server.close((err) => {
        if (chainCopy) {
          chainCopy.removeCallback()
        }
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
}

export function execCmd(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  return new Promise<number>(async (resolve, reject) => {
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
    cmdArgs.push(fs.readFileSync(opts.migrationOverride).toString())
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
  // tslint:disable-next-line: no-console
  console.log(`Creating tmp folder: ${chainCopy.name}`)

  await decompressChain(filename, chainCopy.name)

  const stopGanache = await startGanache(chainCopy.name, { verbose: true }, chainCopy)
  return stopGanache
}

function decompressChain(tarPath: string, copyChainPath: string): Promise<void> {
  // tslint:disable-next-line: no-console
  console.log('Decompressing chain')
  return new Promise((resolve, reject) => {
    targz.decompress({ src: tarPath, dest: copyChainPath }, (err) => {
      if (err) {
        console.error(err)
        reject(err)
      } else {
        // tslint:disable-next-line: no-console
        console.log('Chain decompressed')
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
  const stopGanache = await startGanache(datadir, { verbose: true })
  if (opts.reset || opts.runMigrations) {
    const code = await runMigrations({ upto: opts.upto, migrationOverride: opts.migrationOverride })
    if (code !== 0) {
      throw Error('Migrations failed')
    }
  }
  if (opts.releaseGoldContracts) {
    const code = await deployReleaseGold(opts.releaseGoldContracts)
    if (code !== 0) {
      throw Error('ReleaseGold deployment failed')
    }
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
  // tslint:disable-next-line: no-console
  console.log('Compressing chain')
  return new Promise((resolve, reject) => {
    // ensures the path to the file
    fs.ensureFileSync(filename)
    targz.compress({ src: chainPath, dest: filename }, async (err: Error) => {
      if (err) {
        console.error(err)
        reject(err)
      } else {
        // tslint:disable-next-line: no-console
        console.log('Chain compressed')
        resolve()
      }
    })
  })
}
