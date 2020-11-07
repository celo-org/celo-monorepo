import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { addCeloGethMiddleware, ensure0x, validateAccountAddress } from 'src/lib/utils'
import yargs from 'yargs'
import { GethArgv } from '../geth'

const STATIC_NODES_FILE_NAME = 'static-nodes.json'

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
}

export const builder = (argv: yargs.Argv) => {
  return addCeloGethMiddleware(argv)
    .option('network-id', {
      type: 'string',
      description: 'network id',
      default: '1101',
    })
    .option('sync-mode', {
      choices: ['full', 'fast', 'light', 'lightest'],
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
    .option('nodekeyhex', {
      type: 'string',
      description: 'P2P node key as hex',
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
    .option('verbosity', {
      type: 'number',
      description: 'Verbosity level',
      default: 5,
    })
    .coerce('miner-address', (minerAddress: string) =>
      minerAddress === null ? null : ensure0x(minerAddress)
    )
}

export const handler = async (argv: RunArgv) => {
  const gethBinary = `${argv.gethDir}/build/bin/geth`
  const datadir = argv.dataDir
  const networkId = argv.networkId
  const syncMode = argv.syncMode
  const verbosity = argv.verbosity
  const nodekeyhex = argv.nodekeyhex
  const port = argv.port
  const rpcport = argv.rpcport
  const wsport = argv.wsport

  console.info(`sync mode is ${syncMode}`)
  const mining = argv.mining
  const minerAddress = argv.minerAddress
  const minerGasPrice = argv.minerGasPrice

  if (!fs.existsSync(path.resolve(datadir, STATIC_NODES_FILE_NAME))) {
    console.error(`Error: static-nodes.json was not found in datadir ${datadir}`)
    console.info(`Try running "celotooljs geth static-nodes" or "celotooljs geth init"`)
    process.exit(1)
  }

  const gethArgs = [
    '--datadir',
    datadir,
    '--syncmode',
    syncMode,
    '--rpc',
    '--ws',
    `--wsport=${wsport}`,
    '--wsorigins=*',
    '--rpcapi=eth,net,web3,debug,admin,personal',
    '--debug',
    `--port=${port}`,
    '--nodiscover',
    `--rpcport=${rpcport}`,
    '--rpcvhosts=*',
    '--networkid',
    networkId,
    '--verbosity',
    verbosity.toString(),
    '--consoleoutput=stdout', // Send all logs to stdout
    '--consoleformat=term',
    '--istanbul.lookbackwindow=2',
  ]

  if (nodekeyhex !== null && nodekeyhex.length > 0) {
    gethArgs.push('--nodekeyhex', nodekeyhex)
  }

  if (mining) {
    if (syncMode !== 'full' && syncMode !== 'fast') {
      console.error('Mining works only in full or fast mode')
      process.exit(1)
    }

    if (!validateAccountAddress(minerAddress)) {
      console.error(`Miner address is incorrect: "${minerAddress}"`)
      process.exit(1)
    }

    gethArgs.push(
      '--mine',
      '--minerthreads=10',
      `--miner.gasprice=${minerGasPrice}`,
      '--password=/dev/null',
      `--unlock=${minerAddress}`,
      '--light.serve=90',
      '--allow-insecure-unlock' // geth1.9 to use http w/unlocking
    )
  }

  spawnSync(gethBinary, gethArgs, { stdio: 'inherit' })
}
