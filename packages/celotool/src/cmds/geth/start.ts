import yargs from 'yargs'

import { addCeloGethMiddleware } from 'src/lib/utils'
import { AccountType, getPrivateKeysFor, getValidatorsInformation } from '../../lib/generate_utils'
import { runGethNodes } from '../../lib/geth'
import { GethRunConfig } from '../../lib/interfaces/geth-run-config'
import { GethArgv } from '../geth'

export const command = 'start'
export const describe = 'command for running geth'

interface StartArgv extends GethArgv {
  networkId: string
  syncMode: string
  mining: boolean
  blockTime: number
  nodekeyhex: string
  minerGasPrice: number
  port: number
  rpcport: number
  wsport: number
  verbosity: number
  verbose: boolean
  instances: number
  purge: boolean
  withProxy: boolean
  ethstats: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloGethMiddleware(argv)
    .option('network-id', {
      type: 'string',
      description: 'network id',
      default: '1101',
    })
    .option('sync-mode', {
      choices: ['full', 'fast', 'light', 'ultralight'],
      default: 'full',
    })
    .option('mining', {
      type: 'boolean',
      description: 'Is mining enabled',
      default: false,
    })
    .option('miner-gas-price', {
      type: 'number',
      description: 'Mining gas price',
      default: 0,
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
    .option('blockTime', {
      type: 'number',
      description: 'Block Time',
      default: 1,
    })
}

export const handler = async (argv: StartArgv) => {
  const verbosity = argv.verbosity
  const verbose = argv.verbose

  const gethDir = argv.gethDir
  const datadir = argv.dataDir
  const networkId = parseInt(argv.networkId, 10)
  const syncMode = argv.syncMode
  const blockTime = argv.blockTime

  const port = argv.port
  const rpcport = argv.rpcport
  const wsport = argv.wsport

  const mining = argv.mining
  const minerGasPrice = argv.minerGasPrice
  const network = 'local'
  const instances = argv.instances

  const mnemonic =
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'

  const purge = argv.purge
  const withProxy = argv.withProxy

  const ethstats = argv.ethstats

  console.info(`sync mode is ${syncMode}`)

  const gethConfig: GethRunConfig = {
    runPath: datadir,
    keepData: !purge,
    gethRepoPath: gethDir,
    verbosity,
    networkId,
    network,
    instances: [],
    genesisConfig: {
      blockTime,
    },
  }

  for (let x = 0; x < instances; x++) {
    gethConfig.instances.push({
      name: `${x}-node`,
      validating: mining,
      validatingGasPrice: minerGasPrice,
      syncmode: syncMode,
      ethstats,
      port: port + x,
      rpcport: rpcport + x * 2,
      wsport: wsport + x * 2,
    })

    if (withProxy) {
      gethConfig.instances.push({
        name: `${x}-proxy`,
        validating: false,
        isProxy: true,
        syncmode: syncMode,
        port: port + x + 1000,
        proxyport: port + x + 333,
        rpcport: rpcport + x * 2 + 1000,
        wsport: wsport + x * 2 + 1000,
      })
    }
  }

  const validators = getValidatorsInformation(mnemonic, instances)
  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, instances)

  if (withProxy) {
    for (let i = 0; i < gethConfig.instances.length; i++) {
      const instance = gethConfig.instances[i]
      if (instance.isProxy) {
        instance.proxiedValidatorAddress = validators[i - 1].address
      }
    }
  }

  await runGethNodes({
    gethConfig,
    validators,
    validatorPrivateKeys,
    verbose,
  })
}
