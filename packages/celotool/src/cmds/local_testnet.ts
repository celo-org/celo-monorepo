import { range } from 'lodash'
import { GethInstanceConfig, getHooks, sleep } from 'src/e2e-tests/utils'
import { Admin } from 'web3-eth-admin'
import yargs from 'yargs'

export const command = 'local-testnet'
export const describe = 'command to run a local testnet of geth instances'

interface LocalTestnetArgs {
  localgeth?: string
  branch?: string
  validators: number
  txnodes: number
  lightclients: number
  ultralightclients: number
  migrateto: number
  instances: string
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('localgeth', {
      type: 'string',
      description: 'local path to celo-blockchain repository',
    })
    .option('branch', {
      type: 'string',
      description: 'branch name for remote celo-blockchain repository',
    })
    .option('validators', {
      type: 'number',
      description: 'number of validator nodes to create',
      default: 0,
    })
    .option('txnodes', {
      type: 'number',
      description: 'number of transaction nodes to create',
      default: 0,
    })
    .option('lightclients', {
      type: 'number',
      description: 'number of light client nodes to create',
      default: 0,
    })
    .option('ultralightclients', {
      type: 'number',
      description: 'number of transaction nodes to create',
      default: 0,
    })
    .option('migrateto', {
      type: 'number',
      description: 'maximum migration number to run',
      default: 1000,
    })
    .option('instances', {
      type: 'string',
      description: 'manually enter a GethInstanceConfig[] json blob to add to the config',
      default: '[]',
    })
}

async function waitForSigInt() {
  let signaled = false
  const sigintHandler = () => {
    signaled = true
  }
  process.on('SIGINT', sigintHandler)
  while (!signaled) {
    await sleep(0.1)
  }
  console.info('Received SIGINT: Shutting down...')
  process.removeListener('SIGINT', sigintHandler)
}

function validatorConfigs(count: number): GethInstanceConfig[] {
  return range(count).map((i) => ({
    name: `validator-${i}`,
    validating: true,
    syncmode: 'full',
    port: 0,
  }))
}

function txNodeConfigs(count: number): GethInstanceConfig[] {
  return range(count).map((i) => ({
    name: `tx-node-${i}`,
    validating: false,
    lightserv: true,
    syncmode: 'full',
    port: 0,
  }))
}

function lightClientConfigs(count: number): GethInstanceConfig[] {
  return range(count).map((i) => ({
    name: `light-client-${i}`,
    validating: false,
    syncmode: 'light',
    port: 0,
  }))
}

function ultralightClientConfigs(count: number): GethInstanceConfig[] {
  return range(count).map((i) => ({
    name: `ultralight-client-${i}`,
    validating: false,
    syncmode: 'ultralight',
    port: 0,
  }))
}

// Populate port information for node configs.
function selectPorts(configs: GethInstanceConfig[]): GethInstanceConfig[] {
  for (const [i, config] of configs.entries()) {
    if (!config.port) {
      config.port = 30303 + 2 * i
    }
    if (!config.rpcport && !config.wsport) {
      config.rpcport = 8545 + 2 * i
    }
  }
  return configs
}

function getAdmin(config: GethInstanceConfig) {
  if (!config.wsport && !config.rpcport) {
    throw new Error('connot connect to admin interface for config without port')
  }
  return new Admin(
    `${config.wsport ? 'ws' : 'http'}://localhost:${config.wsport || config.rpcport}`
  )
}

async function getEnode(config: GethInstanceConfig) {
  const admin = getAdmin(config)
  return (await admin.getNodeInfo()).enode
}

async function connectToEnodes(config: GethInstanceConfig, enodes: string[]) {
  const admin = getAdmin(config)
  await Promise.all(enodes.map((enode) => admin.addPeer(enode)))
}

async function connectNodes(configs: GethInstanceConfig[]) {
  // Connect tx nodes to validators and other tx nodes.
  const validators = configs.filter((config) => config.validating)
  const validatorEnodes = await Promise.all(validators.map(getEnode))
  const txNodes = configs.filter((config) => !config.validating && config.syncmode === 'full')
  const txNodeEnodes = await Promise.all(txNodes.map(getEnode))
  await Promise.all(
    txNodes.map((txNode) => connectToEnodes(txNode, validatorEnodes.concat(txNodeEnodes)))
  )

  // Connect light clients to tx nodes.
  const lightClients = configs.filter((config) => ['light', 'ultralight'].includes(config.syncmode))
  await Promise.all(lightClients.map((lightClient) => connectToEnodes(lightClient, txNodeEnodes)))
}

export const handler = async (argv: LocalTestnetArgs) => {
  const gethConfig = {
    migrateTo: argv.migrateto,
    instances: selectPorts([
      ...validatorConfigs(argv.validators),
      ...txNodeConfigs(argv.txnodes),
      ...lightClientConfigs(argv.lightclients),
      ...ultralightClientConfigs(argv.ultralightclients),
      ...JSON.parse(argv.instances),
    ]),
    repository: {
      path: argv.localgeth || '/tmp/geth',
      branch: argv.branch,
      remote: !argv.localgeth,
    },
  }
  const hooks = getHooks(gethConfig)
  await hooks.initialize()
  await connectNodes(gethConfig.instances)

  console.info(`Local testnet is online with ${gethConfig.instances.length} nodes:`)
  for (const instance of gethConfig.instances) {
    console.info(
      `  * ${instance.name} (pid:${instance.pid}) is listening on on http://localhost:${
        instance.rpcport
      }`
    )
  }
  console.info('\nPress CTRL+C to quit')

  await waitForSigInt()
  await hooks.after()
}
