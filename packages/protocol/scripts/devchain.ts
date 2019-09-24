import * as ganache from '@celo/ganache-cli'
import chalk from 'chalk'
import { spawn, SpawnOptions } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as yargs from 'yargs'

const MNEMONIC = 'concert load couple harbor equip island argue ramp clarify fence smart topic'

const gasLimit = 8000000

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
    "Run celo's devchain using given datadir",
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
    (args) => exitOnError(runDevChain(args.datadir, { reset: args.reset, upto: args.upto }))
  )
  .command(
    'generate <datadir>',
    'Create a new devchain directory from scratch',
    (args) =>
      args.positional('datadir', { type: 'string', description: 'Data Dir' }).option('upto', {
        type: 'number',
        description: 'When reset, run upto given migration',
      }),
    (args) => exitOnError(generateDevChain(args.datadir, { upto: args.upto }))
  ).argv

async function startGanache(datadir: string, opts: { verbose?: boolean }) {
  const logFn = opts.verbose
    ? // tslint:disable-next-line: no-console
      (...args: any[]) => console.log(...args)
    : () => {
        /*nothing*/
      }

  const server = ganache.server({
    default_balance_ether: 1000000,
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

async function resetDir(dir: string) {
  if (fs.existsSync(dir)) {
    await execCmd('rm', ['-rf', dir])
  }
}
function createDirIfMissing(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

function runMigrations(opts: { upto?: number } = {}) {
  const cmdArgs = ['truffle', 'migrate']

  if (opts.upto) {
    cmdArgs.push('--to')
    cmdArgs.push(opts.upto.toString())
  }
  return execCmd(`yarn`, cmdArgs, { cwd: ProtocolRoot })
}

async function runDevChain(datadir: string, opts: { reset?: boolean; upto?: number } = {}) {
  if (opts.reset) {
    await resetDir(datadir)
  }
  createDirIfMissing(datadir)
  const stopGanache = await startGanache(datadir, { verbose: true })
  if (opts.reset) {
    await runMigrations({ upto: opts.upto })
  }
  return stopGanache
}

async function generateDevChain(datadir: string, opts: { upto?: number } = {}) {
  const stopGanache = await runDevChain(datadir, { reset: true, upto: opts.upto })
  await stopGanache()
}
