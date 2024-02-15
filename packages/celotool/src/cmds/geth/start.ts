import { readFileSync } from 'fs'
import { addCeloGethMiddleware } from 'src/lib/utils'
import yargs from 'yargs'
import {
  AccountType,
  getPrivateKeysFor,
  getValidatorsInformation,
  privateKeyToPublicKey,
} from '../../lib/generate_utils'
import { getEnodeAddress, migrateContracts, runGethNodes } from '../../lib/geth'
import { GethInstanceConfig } from '../../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../../lib/interfaces/geth-run-config'
import { GethArgv } from '../geth'

export const command = 'start'
export const describe = 'command for running geth'

interface StartArgv extends GethArgv {
  networkId: string
  syncMode: string
  mining: boolean
  blockTime: number
  churritoBlock: number
  donutBlock: number
  port: number
  rpcport: number
  wsport: number
  verbosity: number
  verbose: boolean
  instances: number
  migrate: boolean
  migrateTo: number
  migrationOverrides: string
  monorepoDir: string
  purge: boolean
  withProxy: boolean
  ethstats: string
  mnemonic: string
  initialAccounts: string
}

// hardForkBlockCoercer parses a hard fork activation block as follows:
// "null" => no activation
// "42" => activate at block 42 (and likewise for other numbers >= 0)
const hardForkBlockCoercer = (arg: string) => {
  if (arg === 'null') {
    return undefined
  } else {
    const value = parseInt(arg, 10)
    if (typeof value === 'number' && value >= 0) {
      return value
    } else {
      throw new Error(`Invalid value for hard fork activation block: '${arg}'`)
    }
  }
}

export const builder = (argv: yargs.Argv) => {
  return addCeloGethMiddleware(argv)
    .option('network-id', {
      type: 'string',
      description: 'network id',
      default: '1101',
    })
    .option('sync-mode', {
      choices: ['full', 'fast', 'light', 'ultralight', 'lightest'],
      default: 'full',
    })
    .option('mining', {
      type: 'boolean',
      description: 'Is mining enabled',
      default: false,
    })
    .option('port', {
      type: 'number',
      description: 'Port',
      default: 30303,
    })
    .option('rpcport', {
      type: 'number',
      description: 'HTTP-RPC server listening port',
      default: 8545,
    })
    .option('wsport', {
      type: 'number',
      description: 'WS-RPC server listening port',
      default: 8546,
    })
    .option('instances', {
      type: 'number',
      description: 'Number of instances to run',
      default: 1,
    })
    .option('with-proxy', {
      type: 'boolean',
      description: 'Start with proxy in front',
      default: false,
    })
    .option('verbosity', {
      type: 'number',
      description: 'Geth Verbosity level',
      default: 5,
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Command verbosity flag',
      default: false,
    })
    .option('purge', {
      type: 'boolean',
      description: 'This will purge the data directory before starting.',
      default: false,
    })
    .option('ethstats', {
      type: 'string',
      description: 'address of the ethstats server',
    })
    .option('mnemonic', {
      type: 'string',
      description: 'seed phrase to use for private key generation',
      default:
        'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast',
    })
    .option('blockTime', {
      type: 'number',
      description: 'Block Time',
      default: 1,
    })
    .option('churritoBlock', {
      type: 'string',
      coerce: hardForkBlockCoercer,
      description: 'Churrito hard fork activation block number (use "null" for no activation)',
      default: '0',
    })
    .option('donutBlock', {
      type: 'string',
      coerce: hardForkBlockCoercer,
      description: 'Donut hard fork activation block number (use "null" for no activation)',
      default: '0',
    })
    .option('migrate', {
      type: 'boolean',
      description: 'Migrate contracts',
      default: false,
      implies: 'monorepo-dir',
    })
    .option('migrateTo', {
      type: 'number',
      description: 'Migrate contracts to level x',
      implies: 'monorepo-dir',
    })
    .option('migration-overrides', {
      type: 'string',
      description: 'Path to JSON file containing migration overrides',
      implies: 'migrate',
    })
    .option('monorepo-dir', {
      type: 'string',
      description: 'Directory of the mono repo',
    })
    .option('initial-accounts', {
      type: 'string',
      description:
        'Path to JSON file containing accounts to place in the alloc property of the genesis.json file',
    })
}

export const handler = async (argv: StartArgv) => {
  const verbosity = argv.verbosity
  const verbose = argv.verbose

  const networkId = parseInt(argv.networkId, 10)
  const syncMode = argv.syncMode
  const blockTime = argv.blockTime
  const churritoBlock = argv.churritoBlock
  const donutBlock = argv.donutBlock

  const port = argv.port
  const rpcport = argv.rpcport
  const wsport = argv.wsport

  const mining = argv.mining
  const network = 'local'
  const instances = argv.instances
  const mnemonic = argv.mnemonic
  const migrate = argv.migrate
  const migrateTo = argv.migrateTo
  const initialAccounts = argv.initialAccounts
    ? JSON.parse(readFileSync(argv.initialAccounts).toString())
    : {}
  const migrationOverrides = argv.migrationOverrides
    ? JSON.parse(readFileSync(argv.migrationOverrides).toString())
    : {}
  const monorepoDir = argv.monorepoDir

  const purge = argv.purge
  const withProxy = argv.withProxy

  const ethstats = argv.ethstats

  const gethConfig: GethRunConfig = {
    runPath: argv.dataDir,
    keepData: !purge,
    repository: { path: argv.gethDir },
    verbosity,
    networkId,
    migrate,
    migrateTo,
    migrationOverrides,
    network,
    instances: [],
    genesisConfig: {
      blockTime,
      epoch: 17280,
      initialAccounts,
      churritoBlock,
      donutBlock,
    },
  }

  const validators = getValidatorsInformation(mnemonic, instances)

  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, instances)

  const proxyPrivateKeys = getPrivateKeysFor(AccountType.PROXY, mnemonic, instances)

  for (let x = 0; x < instances; x++) {
    const node: GethInstanceConfig = {
      name: `${x}-node`,
      validating: mining,
      syncmode: syncMode,
      ethstats,
      privateKey: validatorPrivateKeys[x],
      port: port + x,
      rpcport: rpcport + x * 2,
      wsport: wsport + x * 2,
      minerValidator: validators[x].address,
    }

    let proxy: GethInstanceConfig | null = null

    if (withProxy) {
      proxy = {
        name: `${x}-proxy`,
        validating: false,
        isProxy: true,
        syncmode: syncMode,
        ethstats,
        privateKey: proxyPrivateKeys[x],
        port: port + x + 1000,
        proxyport: port + x + 333,
        rpcport: rpcport + x * 2 + 1000,
        wsport: wsport + x * 2 + 1000,
      }

      proxy.proxiedValidatorAddress = validators[x].address
      proxy.proxy = validators[x].address
      proxy.isProxy = true

      node.isProxied = true
      node.proxyAllowPrivateIp = true
      node.proxies = [
        getEnodeAddress(privateKeyToPublicKey(proxyPrivateKeys[x]), '127.0.0.1', proxy.proxyport),
        getEnodeAddress(privateKeyToPublicKey(validatorPrivateKeys[x]), '127.0.0.1', node.port),
      ]
    }

    gethConfig.instances.push(node)
    if (proxy) {
      gethConfig.instances.push(proxy)
    }
  }

  await runGethNodes({
    gethConfig,
    validators,
    verbose,
  })

  if (gethConfig.migrate || gethConfig.migrateTo) {
    const attestationKeys = getPrivateKeysFor(AccountType.ATTESTATION, mnemonic, instances)

    console.info('Migrating contracts (this will take a long time) ...')

    await migrateContracts(
      monorepoDir,
      validatorPrivateKeys,
      attestationKeys,
      validators.map((x) => x.address),
      gethConfig.migrateTo,
      gethConfig.migrationOverrides,
      verbose
    )

    console.info('... done migrating contracts!')
  }
}
