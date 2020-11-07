import { execCmd } from 'src/lib/cmd-utils'
import {
  addCeloEnvMiddleware,
  CeloEnvArgv,
  envVar,
  failIfNotVmBased,
  fetchEnv,
} from 'src/lib/env-utils'
import { getProxiesPerValidator } from 'src/lib/testnet-utils'
import { getNodeVmName, getVmSshCommand, indexCoercer, ProxyIndex } from 'src/lib/vm-testnet-utils'
import yargs from 'yargs'

export const command = 'vm-exec'

export const describe = 'SSH and exec commands on all or individual nodes in a VM-based env'

interface ValidatorsExecArgv extends CeloEnvArgv {
  nodeType: string
  docker: string
  cmd: string
  only: number | ProxyIndex
  from: number | ProxyIndex
  to: number | ProxyIndex
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('nodeType', {
      describe: 'Type of node',
      choices: ['validator', 'tx-node', 'tx-node-private', 'bootnode', 'proxy'],
      type: 'string',
    })
    .option('docker', {
      type: 'string',
      description: 'Operation to run on the docker container {start|stop|restart}',
      default: 'restart',
    })
    .option('cmd', {
      type: 'string',
      description: 'Arbitrary command to exec',
      default: null,
    })
    .option('only', {
      type: 'string',
      description:
        'Index of the only node to exec on. If the node is a proxy, the validator and proxy indices must both be specified as `<validator index>:<proxy index>`',
      default: null,
      coerce: indexCoercer,
    })
    .option('from', {
      type: 'string',
      description:
        'Index of the node to start on when exec-ing over a range. If the node is a proxy, the validator and proxy indices must both be specified as `<validator index>:<proxy index>`',
      default: '0',
      coerce: indexCoercer,
    })
    .option('to', {
      type: 'string',
      description:
        'Index of the node to end on when exec-ing over a range (not inclusive). If the node is a proxy, the validator and proxy indices must both be specified as `<validator index>:<proxy index>`. Defaults to the max index for the nodeType.',
      default: '-1',
      coerce: indexCoercer,
    })
}

export const handler = async (argv: ValidatorsExecArgv) => {
  failIfNotVmBased()

  const project = fetchEnv(envVar.TESTNET_PROJECT_NAME)
  const zone = fetchEnv(envVar.KUBERNETES_CLUSTER_ZONE)

  const cmd = argv.cmd === null ? `sudo docker ${argv.docker} geth` : argv.cmd

  console.info(
    `Running on validators.\n` +
      `Cmd: ${cmd}\n` +
      `Env: ${argv.celoEnv}\n` +
      `Project: ${project}\n` +
      `Zone: ${zone}\n` +
      `Node Type: ${argv.nodeType}`
  )

  // For proxy / tx-nodes that have random suffixes, we are forced to run a
  // gcloud command and await it in order to get the full instance name.
  // Because of this, we end up calling the SSH command, and then moving on to get the
  // next instance name, which takes time, so the previous SSH command is nearly finished.
  // By doing this in two steps, we more closely make the exec across all instances
  // happen in parallel
  const instanceNames: string[] = []
  if (argv.only === null) {
    let to: number | ProxyIndex = argv.to

    if (typeof to === 'number' && to < 0) {
      to = getMaxNodeIndex(argv.nodeType)
    }

    console.info('Max Node Index:', getMaxNodeIndex(argv.nodeType))
    console.info('From Index:', argv.from)
    console.info('To Index:', to)

    const indexIterator = createIndexIterator(argv.from, to)
    let index = indexIterator.next()
    while (!index.done) {
      const instanceName = await getNodeVmName(argv.celoEnv, argv.nodeType, index.value)
      instanceNames.push(instanceName)
      index = indexIterator.next()
    }
  } else {
    console.info(`Only Index: ${argv.only}`)
    const instanceName = await getNodeVmName(argv.celoEnv, argv.nodeType, argv.only)
    instanceNames.push(instanceName)
  }

  const runCmds = []
  for (const instanceName of instanceNames) {
    runCmds.push(runSshCommand(instanceName, cmd))
  }

  await Promise.all(runCmds)

  console.info('Done.')
}

async function runSshCommand(instanceName: string, cmd: string) {
  const bareSshCmd = getVmSshCommand(instanceName)
  const fullCmd = `${bareSshCmd} --command "${cmd}"`
  console.info(`Running ${fullCmd}`)
  return execCmd(fullCmd, {}, false, true)
}

function getMaxNodeIndex(nodeType: string): number | ProxyIndex {
  switch (nodeType) {
    case 'validator':
      return parseInt(fetchEnv(envVar.VALIDATORS), 10)
    case 'tx-node':
      return parseInt(fetchEnv(envVar.TX_NODES), 10)
    case 'tx-node-private':
      return parseInt(fetchEnv(envVar.PRIVATE_TX_NODES), 10)
    case 'bootnode':
      return 1
    case 'proxy':
      const proxiesPerValidator = getProxiesPerValidator()
      if (!proxiesPerValidator.length) {
        return {
          validatorIndex: 0,
          proxyIndex: 0,
        }
      }
      return {
        validatorIndex: proxiesPerValidator.length - 1,
        proxyIndex: proxiesPerValidator[proxiesPerValidator.length - 1],
      }
    default:
      throw new Error('Invalid node type')
  }
}

function* createIndexIterator(from: number | ProxyIndex, to: number | ProxyIndex) {
  if (typeof from !== typeof to) {
    throw Error('From and to indices should be of the same type')
  }
  if (typeof from === 'number') {
    // iterate through numeric indices
    for (let i = from; i < to; i++) {
      yield i
    }
  } else {
    const proxyFrom = from as ProxyIndex
    const proxyTo = to as ProxyIndex
    // iterate through proxy indices
    const proxiesPerValidator = getProxiesPerValidator()
    const minValidatorIndex = Math.min(proxiesPerValidator.length, proxyTo.validatorIndex)
    for (let valIndex = proxyFrom.validatorIndex; valIndex <= minValidatorIndex; valIndex++) {
      const maxProxyIndex =
        valIndex === proxyTo.validatorIndex ? proxyTo.proxyIndex : proxiesPerValidator[valIndex]
      for (let proxyIndex = from.proxyIndex; proxyIndex < maxProxyIndex; proxyIndex++) {
        const index: ProxyIndex = {
          validatorIndex: valIndex,
          proxyIndex,
        }
        yield index
      }
    }
  }
}
