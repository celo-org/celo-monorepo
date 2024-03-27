import { newKit } from '@celo/contractkit'
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
export const describe = `Command to run a local testnet of geth instances.

Running this command will create a number of geth nodes, connect them together to form a network,
and run smart contract migrations to initialize the core protocols. When this is complete, it will
open a NodeJS console with some preloaded objects to facilitate interactions with the test network.
Exiting this console will kill all running geth instances and exit.

Examples:
* local-testnet
* local-testnet --local-geth ~/code/celo-blockchain
* local-testnet --validators 5 --proxies 3 --bootnode
* local-testnet --tx-nodes 2 --light-clients 3
* local-testnet --migrate-to 19 --migration-override '{ "lockedGold": { "unlockingPeriod": 30 } }'
* local-testnet --migrate-to 19 --migration-override ../../node_modules/@celo/dev-utils/lib/migration-override.json
* local-testnet --no-migrate --genesis-override '{ "blockTime": 3, "epoch": 50 }'

Network makeup is configured the --validators, --tx-nodes, --light-clients, and --lightest-client
flags. These flags will add the corresponding nodes to the network.

A NodeJS REPL is provided to conveniently interact with the created network. A number of global
variables are defined with useful values including {
  Web3 (Imported 'web3' module)
  Admin (Imported 'web3-eth-admin' module)
  testnet: GethRunConfig (Configuration values for the tesnet)
  [nodeType][index] (e.g. validator0, txNode2): {
    web3: Web3 (A web3 object connected to the node over RPC)
    kit: ContractKit (A contractkit object connected to the node over RPC)
    admin: Admin (An Admin object connected to the node over RPC)
    config: GethInstanceConfig (Configuration values for the node)
    kill(signal?: string): (Send a signal, default SIGTERM, to the node. e.g. SIGINT, SIGSTOP)
  }
}

Tip: Export NODE_OPTIONS="--experimental-repl-await" in your terminal to natively use await.

When the network is created without a bootnode, all nodes will be connected as follows:
* Proxy nodes are connected to their validators, other proxies and unproxied validators.
* Unproxied validator nodes are connected to all other proxies and unproxied validators.
* Transaction nodes are connected to proxies and unproxied validators and other transaction nodes.
* Light clients are connected to all transaction nodes.

If the network is started with the --bootnode flag, a bootnode will be created and all nodes will be
connected to it, rather than each other directly.

By default, the celo-blockchain repository will be cloned to a temporary location and built from
master to produce the geth binary to run for each node. The --branch flag can be used to control
which branch is built in the cloned repository. Alternatively, a existing repository can be used
by specifying the --local-geth flag as the path to that repository root.`

interface LocalTestnetArgs {
  localgeth?: string
  keepdata?: boolean
  branch?: string
  bootnode: boolean
  validators: number
  proxies: number
  txnodes: number
  lightclients: number
  lightestclients: number
  migrate: boolean
  migrateTo: number
  instances: string
  genesisOverride: string
  migrationOverride: string
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('local-geth', {
      type: 'string',
      description: 'Local path to celo-blockchain repository.',
      alias: ['localGeth', 'localgeth'],
    })
    .option('keep-data', {
      type: 'boolean',
      decription: 'Keep the data directory from any previous runs.',
      alias: ['keepData', 'keepdata'],
    })
    .option('branch', {
      type: 'string',
      description: 'Branch name for remote celo-blockchain repository.',
    })
    .option('bootnode', {
      type: 'boolean',
      allowNo: true,
      description: 'Create a bootnode and connect all nodes to it instead of to each other.',
    })
    .option('validators', {
      type: 'number',
      description: 'Number of validator nodes to create.',
      default: 1,
    })
    .option('proxies', {
      type: 'number',
      description: 'Number of proxy nodes to create; assigned to the first n validators.',
      default: 0,
    })
    .option('tx-nodes', {
      type: 'number',
      description: 'Number of transaction (i.e. non-validating full nodes) nodes to create.',
      default: 0,
      alias: ['txnodes', 'txNodes'],
    })
    .option('light-clients', {
      type: 'number',
      description: 'Number of light sync nodes to create.',
      default: 0,
      alias: ['lightClients', 'lightclients'],
    })
    .option('lightest-clients', {
      type: 'number',
      description: 'Number of lightest sync nodes to create.',
      default: 0,
      alias: ['lightestClients', 'lightestclients'],
    })
    .option('migrate', {
      type: 'boolean',
      description: 'Whether migrations should be run.',
      default: true,
      allowNo: true,
    })
    .option('migrate-to', {
      type: 'number',
      description: 'Maximum migration number to run. Defaults to running all migrations.',
      alias: ['migrateTo', 'migrateto'],
    })
    .option('instances', {
      type: 'string',
      description: 'Manually enter a GethInstanceConfig[] json blob to add to the config.',
      default: '[]',
    })
    .option('genesis-override', {
      type: 'string',
      description: 'Genesis configuration overrides as a GenesisConfig JSON blob.',
      default: '{}',
      alias: ['genesisOverride', 'genesisoverride'],
    })
    .option('migration-override', {
      type: 'string',
      description: 'Migration configuration overrides as a JSON blob.',
      default: '{}',
      alias: ['migrationOverride', 'migrationoverride'],
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
          kit: newKit(getRpcUrl(instance)),
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
  if (lightClients.length > 0 && txNodeEnodes.length === 0) {
    throw new Error('connecting light clients to the network requires at least one tx-node')
  }
  await Promise.all(lightClients.map((lightClient) => connectToEnodes(lightClient, txNodeEnodes)))
}

export const handler = async (argv: LocalTestnetArgs) => {
  const repoPath = argv.localgeth || '/tmp/geth'

  const gethConfig: GethRunConfig = {
    network: 'local',
    networkId: 1101,
    runPath: '/tmp/e2e',
    keepData: argv.keepdata,
    migrate: argv.migrate,
    migrateTo: argv.migrate ? argv.migrateTo : undefined,
    instances: populateConnectionInfo([
      ...validatorConfigs(argv.validators, argv.proxies),
      ...txNodeConfigs(argv.txnodes),
      ...lightClientConfigs(argv.lightclients),
      ...lightestClientConfigs(argv.lightestclients),
      ...bootnodeConfigs(argv.bootnode ? 1 : 0),
      ...JSON.parse(argv.instances),
    ]),
    repository: {
      path: repoPath,
      branch: argv.branch,
      remote: !argv.localgeth,
    },
    genesisConfig: JSON.parse(argv.genesisOverride),
    migrationOverrides: JSON.parse(argv.migrationOverride),
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
