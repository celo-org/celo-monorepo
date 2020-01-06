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
  nodekeyhex: string
  minerGasPrice: number
  port: number
  rpcport: number
  wsport: number
  verbosity: number
  verbose: boolean
  amount: number
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
      demandOption: true,
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
    .option('amount', {
      type: 'number',
      description: 'Amount of nodes to run',
      default: 1,
    })
    .option('with-proxy', {
      type: 'boolean',
      description: 'Start with proxy in front',
      default: false,
    })
    .option('verbosity', {
      type: 'number',
      description: 'Verbosity level',
      default: 5,
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Verbose',
      default: false,
    })
    .option('purge', {
      type: 'boolean',
      description: 'purge',
      default: false,
    })
    .option('ethstats', {
      type: 'string',
      description: 'address of the ethstats server',
    })
}

export const handler = async (argv: StartArgv) => {
  const verbosity = argv.verbosity
  const verbose = argv.verbose

  const gethDir = argv.gethDir
  const datadir = argv.dataDir
  const networkId = parseInt(argv.networkId, 10)
  const syncMode = argv.syncMode

  const port = argv.port
  const rpcport = argv.rpcport
  const wsport = argv.wsport

  const mining = argv.mining
  const minerGasPrice = argv.minerGasPrice

  const mnemonic =
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'

  const numNodes = argv.amount
  const purge = argv.purge
  const withProxy = argv.withProxy

  const network = 'local'
  const ethstats = argv.ethstats || undefined

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
      blockTime: 1,
    },
  }

  for (let x = 0; x < numNodes; x++) {
    gethConfig.instances.push({
      gethRunConfig: gethConfig,
      name: `${x}-node`,
      validating: mining,
      validatingGasPrice: minerGasPrice,
      syncmode: syncMode,
      port: port + x,
      ethstats,
      rpcport: rpcport + x * 2,
      wsport: wsport + x * 2,
    })

    if (withProxy) {
      gethConfig.instances.push({
        gethRunConfig: gethConfig,
        name: `${x}-proxy`,
        validating: false,
        isProxy: true,
        syncmode: syncMode,
        port: port + x + 1000,
        rpcport: rpcport + x * 2 + 1000,
        wsport: wsport + x * 2 + 1000,
      })
    }
  }

  const validators = getValidatorsInformation(mnemonic, numNodes)
  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, numNodes)

  await runGethNodes({
    gethConfig,
    validators,
    validatorPrivateKeys,
    verbose,
  })
}
