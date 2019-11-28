import { addCeloGethMiddleware, ensure0x } from 'src/lib/utils'
import yargs from 'yargs'
import { GethArgv } from '../geth'
import { GethInstanceConfig, GethRunConfig, runGethNodes } from '../../lib/geth'
import { AccountType, getPrivateKeysFor, getValidatorsInformation } from '../../lib/generate_utils'

export const command = 'run'
export const describe = 'command for running geth'

interface RunArgv extends GethArgv {
  networkId: string
  syncMode: string
  mining: boolean
  minerAddress: string
  nodekeyhex: string
  minerGasPrice: number
  port: number
  rpcport: number
  wsport: number
  verbosity: number
  amount: number
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
    .option('miner-address', {
      type: 'string',
      description: 'Address of the miner',
      default: null,
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
    .option('verbosity', {
      type: 'number',
      description: 'Verbosity level',
      default: 5,
    })
    .coerce(
      'miner-address',
      (minerAddress: string) => (minerAddress === null ? null : ensure0x(minerAddress))
    )
}

export const handler = async (argv: RunArgv) => {
  //  const verbosity = argv.verbosity

  const gethDir = argv.gethDir
  const datadir = argv.dataDir
  const networkId = parseInt(argv.networkId)
  const syncMode = argv.syncMode

  const port = argv.port
  const rpcport = argv.rpcport
  const wsport = argv.wsport

  //  const mining = argv.mining
  //  const minerAddress = argv.minerAddress
  //  const minerGasPrice = argv.minerGasPrice

  const mnemonic =
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'

  const numNodes = argv.amount
  // const network = 'local'

  console.info(`sync mode is ${syncMode}`)

  const gethConfig: GethRunConfig = {
    runPath: datadir,
    genesisPath: datadir + '/genesis.json',
    gethRepoPath: gethDir,
    networkId: networkId,
    instances: [],
  }

  for (let x = 0; x < numNodes; x++) {
    gethConfig.instances.push({
      gethRunConfig: gethConfig,
      name: `${x}-node`,
      validating: true,
      syncmode: syncMode,
      port: port + x,
      rpcport: rpcport + x * 2,
      wsport: wsport + x * 2,
    } as GethInstanceConfig)
  }

  const validators = getValidatorsInformation(mnemonic, numNodes)
  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, numNodes)

  await runGethNodes({
    gethConfig,
    keepData: true,
    validatorPrivateKeys,
    validators,
  })
}
