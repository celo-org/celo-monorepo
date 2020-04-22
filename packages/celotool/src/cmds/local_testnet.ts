import { extend, range } from 'lodash'
import { getHooks, sleep } from 'src/e2e-tests/utils'
import { privateKeyToPublicKey } from 'src/lib/generate_utils'
import { GethInstanceConfig } from 'src/lib/interfaces/geth-instance-config'
import { GethRunConfig } from 'src/lib/interfaces/geth-run-config'
import Web3 from 'web3'
import { Admin } from 'web3-eth-admin'
import yargs from 'yargs'

const Account: any = require('eth-lib/lib/account')

export const command = 'local-testnet'
export const describe = 'Command to run a local testnet of geth instances.'

interface LocalTestnetArgs {
  localgeth?: string
  branch?: string
  bootnode: boolean
  validators: number
  proxies: number
  txnodes: number
  lightclients: number
  lightestclients: number
  migrateto: number
  instances: string
  keepdata?: boolean
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
    .option('bootnode', {
      type: 'boolean',
      description: 'create a bootnode if flag is specified',
    })
    .option('validators', {
      type: 'number',
      description: 'number of validator nodes to create',
      default: 0,
    })
    .option('proxies', {
      type: 'number',
      description: 'number of proxy nodes to create, assigned to the first n validators',
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
    .option('lightestclients', {
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
    .option('keepdata', {
      type: 'boolean',
      decription: 'keep the data directory from any previous runs',
    })
}

async function repl(config: GethRunConfig) {
  const session = require('repl').start()
  const formatName = (name: string) =>
    name
      .split('-')
      .map((token, i) => (i === 0 ? token[0] : token[0].toUpperCase()) + token.slice(1))
      .join('')

  extend(session.context, {
    Web3,
    Admin,
    testnet: config,
    ...config.instances.reduce(
      (o, instance) => ({
        ...o,
        [formatName(instance.name)]: {
          web3: new Web3(getRpcUrl(instance)),
          admin: new Admin(getRpcUrl(instance)),
          config: instance,
          kill: (signal?: string) => {
            if (!instance.pid) {
              throw new Error(`no pid registered for instance ${instance.name}`)
            }
            process.kill(instance.pid, signal)
          },
        },
      }),
      {}
    ),
  })

  // Wait for the REPL to exit.
  let exited = false
  const exitHandler = () => {
    exited = true
  }
  session.on('exit', exitHandler)
  while (!exited) {
    await sleep(0.1)
  }
  session.removeListener('exit', exitHandler)
}

function bootnodeConfigs(count: number): GethInstanceConfig[] {
  return range(count).map((i) => ({
    name: `bootnode-${i}`,
    lightserv: false,
    syncmode: 'full',
    nodekey: generatePrivateKey(),
    port: 0,
  }))
}

function validatorConfigs(count: number, proxyCount: number = 0): GethInstanceConfig[] {
  const validators: GethInstanceConfig[] = range(count).map((i) => ({
    name: `validator-${i}`,
    validating: true,
    syncmode: 'full',
    isProxied: i < proxyCount,
    proxy: i < proxyCount ? `proxy-${i}` : undefined,
    proxyAllowPrivateIp: i < proxyCount ? true : undefined,
    port: 0,
  }))
  const proxies: GethInstanceConfig[] = range(proxyCount).map((i) => ({
    name: `proxy-${i}`,
    syncmode: 'full',
    isProxy: true,
    port: 0,
  }))
  return validators.concat(proxies)
}

function txNodeConfigs(count: number): GethInstanceConfig[] {
  return range(count).map((i) => ({
    name: `tx-node-${i}`,
    lightserv: true,
    syncmode: 'full',
    port: 0,
  }))
}

function lightClientConfigs(count: number): GethInstanceConfig[] {
  return range(count).map((i) => ({
    name: `light-client-${i}`,
    syncmode: 'light',
    port: 0,
  }))
}

function lightestClientConfigs(count: number): GethInstanceConfig[] {
  return range(count).map((i) => ({
    name: `lightest-client-${i}`,
    syncmode: 'lightest',
    port: 0,
  }))
}

// Populate network information in instance configs.
function populateConnectionInfo(configs: GethInstanceConfig[]): GethInstanceConfig[] {
  // Choose ports for each instance.
  for (const [i, config] of configs.entries()) {
    if (!config.port) {
      config.port = 30303 + 2 * i
    }
    if (config.isProxy && !config.proxyport) {
      config.proxyport = 30503 + 2 * i
    }
    if (!config.rpcport && !config.wsport) {
      config.rpcport = 8545 + 2 * i
      config.wsport = 8546 + 2 * i
    }
  }

  // If a bootnode is provided, populate bootnode information in other nodes.
  const bootnodes = configs.filter((config) => /bootnode/.test(config.name))
  if (bootnodes.length > 0) {
    // Only one in-use bootnode is supported.
    const bootnode = bootnodes[0]
    for (const config of configs) {
      if (config.name === bootnode.name || config.isProxied) {
        continue
      }
      config.bootnodeEnode = getEnodeUrl(bootnode)
    }
  }

  return configs
}

function getEnodeUrl(config: GethInstanceConfig) {
  if (!config.nodekey) {
    throw new Error('cannot get the enode url from a config without a nodekey')
  }
  return `enode://${privateKeyToPublicKey(config.nodekey)}@localhost:${config.port}`
}

function generatePrivateKey() {
  return Account.create(Web3.utils.randomHex(32)).privateKey.replace('0x', '')
}

function getRpcUrl(config: GethInstanceConfig) {
  return `${config.wsport ? 'ws' : 'http'}://localhost:${config.wsport || config.rpcport}`
}

function getAdmin(config: GethInstanceConfig) {
  if (!config.wsport && !config.rpcport) {
    throw new Error('connot connect to admin interface for config without port')
  }
  return new Admin(getRpcUrl(config))
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
  const validators = configs.filter(
    (config) => (config.validating && !config.isProxied) || config.isProxy
  )
  const validatorEnodes = await Promise.all(validators.map(getEnode))
  const txNodes = configs.filter((config) => !config.validating && config.syncmode === 'full')
  const txNodeEnodes = await Promise.all(txNodes.map(getEnode))
  await Promise.all(
    txNodes.map((txNode) => connectToEnodes(txNode, validatorEnodes.concat(txNodeEnodes)))
  )

  // Connect light clients to tx nodes.
  const lightClients = configs.filter((config) => ['light', 'lightest'].includes(config.syncmode))
  await Promise.all(lightClients.map((lightClient) => connectToEnodes(lightClient, txNodeEnodes)))
}

export const handler = async (argv: LocalTestnetArgs) => {
  const repoPath = argv.localgeth || '/tmp/geth'

  const gethConfig: GethRunConfig = {
    network: 'local',
    networkId: 1101,
    runPath: '/tmp/e2e',
    keepData: argv.keepdata,
    migrateTo: argv.migrateto,
    instances: populateConnectionInfo([
      ...bootnodeConfigs(argv.bootnode ? 1 : 0),
      ...validatorConfigs(argv.validators, argv.proxies),
      ...txNodeConfigs(argv.txnodes),
      ...lightClientConfigs(argv.lightclients),
      ...lightestClientConfigs(argv.lightestclients),
      ...JSON.parse(argv.instances),
    ]),
    repository: {
      path: repoPath,
      branch: argv.branch,
      remote: !argv.localgeth,
    },
  }
  const hooks = getHooks(gethConfig)
  await hooks.initialize()

  if (!argv.bootnode) {
    await connectNodes(gethConfig.instances)
  }

  console.info(`Local testnet is online with ${gethConfig.instances.length} nodes:`)
  for (const instance of gethConfig.instances) {
    console.info(
      `  * ${instance.name} (pid:${instance.pid}) is listening on ${getRpcUrl(instance)}`
    )
  }
  console.info('\nPress CTRL+D to quit')

  await repl(gethConfig)
  await hooks.after()
  process.exit(0)
}
