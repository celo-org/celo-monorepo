import fs from 'fs'
import path from 'path'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { getEnodesAddresses, writeStaticNodes } from 'src/lib/geth'
import { addCeloGethMiddleware } from 'src/lib/utils'
import yargs from 'yargs'
import { GethArgv } from '../geth'

const STATIC_NODES_FILE_NAME = 'static-nodes.json'
const DEFAULT_GENESIS_FILE_NAME = 'genesis_default.json'

export const command = 'init'

export const describe = 'command for initializing geth'

interface InitArgv extends CeloEnvArgv, GethArgv {
  genesis: string | null
  fetchStaticNodesFromNetwork: boolean | null
}

export const builder = (argv: yargs.Argv) => {
  return addCeloGethMiddleware(addCeloEnvMiddleware(argv))
    .option('genesis', {
      type: 'string',
      description:
        'path to genesis.json | default genesis_default.json will be used if not specified',
      default: null,
    })
    .option('fetch-static-nodes-from-network', {
      type: 'boolean',
      description: 'Automically fetch static nodes from the network',
      default: true,
    })
}

const invalidArgumentExit = (argumentName: string, errorMessage: string) => {
  console.error(`Invalid argument ${argumentName}: ${errorMessage}`)
  process.exit(1)
}

export const handler = async (argv: InitArgv) => {
  const namespace = argv.celoEnv
  const gethBinary = `${argv.gethDir}/build/bin/geth`
  const datadir = argv.dataDir
  const genesis = argv.genesis ? argv.genesis : path.resolve(__dirname, DEFAULT_GENESIS_FILE_NAME)

  if (
    fs.existsSync(path.resolve(datadir, STATIC_NODES_FILE_NAME)) ||
    fs.existsSync(path.resolve(datadir, 'geth'))
  ) {
    invalidArgumentExit('datadir', `Looks like geth has been already initialized in dir ${datadir}`)
  }

  if (!fs.existsSync(datadir)) {
    // Directory does not exist, create it.
    fs.mkdirSync(datadir)
  }

  if (!fs.lstatSync(datadir).isDirectory()) {
    invalidArgumentExit('datadir', `${datadir} is not a directory`)
  }

  if (!fs.existsSync(genesis)) {
    invalidArgumentExit('genesis', `No such file: ${genesis}`)
  }

  await execCmdWithExitOnFailure(`${gethBinary} --datadir "${datadir}" init ${genesis}`)

  if (argv.fetchStaticNodesFromNetwork) {
    await switchToClusterFromEnv(false)
    await getEnodesAddresses(namespace).then((enodes) => {
      writeStaticNodes(enodes, datadir, STATIC_NODES_FILE_NAME)
      console.info(`Geth has been initialized successfully! 😎`)
    })
  }
}
