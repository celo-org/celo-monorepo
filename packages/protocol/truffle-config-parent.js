/* tslint:disable: object-literal-sort-keys */
require('ts-node/register')
const ProviderEngine = require('web3-provider-engine')
const WebsocketSubprovider = require('web3-provider-engine/subproviders/websocket.js')
const { TruffleArtifactAdapter } = require('@0x/sol-trace')
const { CoverageSubprovider } = require('@0x/sol-coverage')
var Web3 = require('web3')
var net = require('net')

const HDWalletProvider = require('@truffle/hdwallet-provider')

const argv = require('minimist')(process.argv.slice(2), {
  string: ['truffle_override', 'network'],
  boolean: ['reset'],
})

const ALFAJORES_NETWORKID = 44787
const BAKLAVA_NETWORKID = 62320
const BAKLAVASTAGING_NETWORKID = 31420
const CANNOLI_NETWORKID = 17323

const OG_FROM = '0xfeE1a22F43BeeCB912B5a4912ba87527682ef0fC'
const DEVELOPMENT_FROM = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
const INTEGRATION_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const INTEGRATION_TESTING_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const ALFAJORESSTAGING_FROM = '0xf4314cb9046bece6aa54bb9533155434d0c76909'
const ALFAJORES_FROM = '0x456f41406B32c45D59E539e4BBA3D7898c3584dA'
const RC0_FROM = '0x469be98FE71AFf8F6e7f64F9b732e28A03596B5C'
const BAKLAVA_FROM = '0x0Cc59Ed03B3e763c02d54D695FFE353055f1502D'
const BAKLAVASTAGING_FROM = '0x4588ABb84e1BBEFc2BcF4b2296F785fB7AD9F285'
const STAGING_FROM = '0x4e3d385ecdee402da395a3b18575b05cc5e8ff21'
const CANNOLI_FROM = '0x8C174E896A85E487aa895865657b78Ea64879dC7' // validator zero

const gasLimit = 20000000
const hostAddress = process.env.CELO_NODE_ADDRESS || '127.0.0.1'
const hostPort = parseInt(process.env.CELO_NODE_PORT || '8545')

const defaultConfig = {
  host: hostAddress,
  port: hostPort,
  network_id: 1101,
  from: OG_FROM,
  gas: gasLimit,
  gasPrice: 100000000000,
  maxFeePerGas: 975000000000,
}

const freeGasConfig = { ...defaultConfig, ...{ gasPrice: 0 } } // TODO remove

// ipcProvider returns a function to create an IPC provider when called.
// Use by adding `provider: ipcProvider(...)` to any of the configs below.
function ipcProvider(path) {
  return () => new Web3.providers.IpcProvider(path, net)
}

// Here to avoid recreating it each time
let coverageProvider = null

const fornoUrls = {
  alfajores: 'https://alfajores-forno.celo-testnet.org',
  // alfajores: 'http://127.0.0.1:8545',
  baklava: 'https://baklava-forno.celo-testnet.org',
  // baklava: 'http://127.0.0.1:8545',
  rc1: 'https://forno.celo.org',
  mainnet: 'https://forno.celo.org',
  staging: 'https://staging-forno.celo-networks-dev.org',
}

const networks = {
  development: {
    ...defaultConfig,
    from: DEVELOPMENT_FROM,
    gasPrice: 0,
    gas: gasLimit,
    defaultBalance: 200000000,
    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
  },
  rc0: {
    host: hostAddress,
    port: hostPort,
    from: RC0_FROM,
    network_id: 200312,
    gasPrice: 100000000000,
  },
  rc1: {
    host: '127.0.0.1',
    port: 8545,
    from: '0xE23a4c6615669526Ab58E9c37088bee4eD2b2dEE',
    network_id: 42220,
    gas: gasLimit,
    gasPrice: 10000000000,
  },
  coverage: {
    host: 'localhost',
    network_id: '*',
    gasPrice: 0,
    gas: gasLimit,
    from: DEVELOPMENT_FROM,
    provider: function () {
      if (coverageProvider == null) {
        coverageProvider = new ProviderEngine()

        const projectRoot = ''
        const artifactAdapter = new TruffleArtifactAdapter(projectRoot, SOLC_VERSION)
        global.coverageSubprovider = new CoverageSubprovider(artifactAdapter, DEVELOPMENT_FROM, {
          isVerbose: true,
          ignoreFilesGlobs: [
            // Proxies
            '**/*Proxy.sol',

            // Test contracts
            '**/test/*.sol',

            // Interfaces
            '**/interfaces/*.sol',
          ],
        })
        coverageProvider.addProvider(global.coverageSubprovider)

        coverageProvider.addProvider(
          new WebsocketSubprovider({
            rpcUrl: `http://localhost:${defaultConfig.port}`,
            debug: false,
          })
        )

        coverageProvider.start((err) => {
          if (err !== undefined) {
            // eslint-disable-next-line: no-console
            console.error(err)
            process.exit(1)
          }
        })
        /**
         * HACK: Truffle providers should have `send` function, while `ProviderEngine` creates providers with `sendAsync`,
         * but it can be easily fixed by assigning `sendAsync` to `send`.
         */
        coverageProvider.send = coverageProvider.sendAsync.bind(coverageProvider)
      }
      return coverageProvider
    },
  },
  testnet_prod: defaultConfig,
  anvil: {
    ...defaultConfig,
    network_id: 31337,
    from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  },
  // New testnets
  integration: {
    ...defaultConfig,
    from: INTEGRATION_FROM,
  },
  testing: {
    ...defaultConfig,
    from: INTEGRATION_TESTING_FROM,
    network_id: 1101,
  },
  alfajoresstaging: {
    ...defaultConfig,
    from: ALFAJORESSTAGING_FROM,
  },

  alfajores: {
    ...defaultConfig,
    network_id: ALFAJORES_NETWORKID,
    // from: ALFAJORES_FROM,
    from: '0x3e206e0674d5050f7b33e7e79Cace768050eE06f',
    // mnemonic:
    //   '',
  },

  cannoli: {
    ...defaultConfig,
    network_id: CANNOLI_NETWORKID,
    from: CANNOLI_FROM,
  },

  baklava: {
    ...defaultConfig,
    from: '0x3e206e0674d5050f7b33e7e79Cace768050eE06f',
    network_id: BAKLAVA_NETWORKID,
    mnemonic: '',
  },
  baklavastaging: {
    ...defaultConfig,
    from: BAKLAVASTAGING_FROM,
    network_id: BAKLAVASTAGING_NETWORKID,
  },
  staging: {
    ...defaultConfig,
    from: STAGING_FROM,
  },
}

console.log('hello from parent config')
// Equivalent
networks.mainnet = networks.rc1

// If an override was provided, apply it.
// If the network is missing from networks, start with the default config.
if (argv.truffle_override || !(argv.network in networks)) {
  const configOverride = argv.truffle_override ? JSON.parse(argv.truffle_override) : {}
  if (argv.network in networks) {
    networks[argv.network] = { ...networks[argv.network], ...configOverride }
  } else {
    networks[argv.network] = { ...defaultConfig, ...configOverride }
  }
}

console.log('hello from parent confi2')

if (process.argv.includes('--forno')) {
  if (!fornoUrls[argv.network]) {
    console.log(`Forno URL for network ${argv.network} not known!`)
    process.exit(1)
  }

  networks[argv.network].host = undefined
  networks[argv.network].port = undefined

  // TODO check how to read this from env file
  console.log('hola')
  const mnemonic = networks[argv.network].mnemonic
  console.log('mnemonic is', mnemonic)
  if (networks[argv.network].mnemonic) {
    console.log('try to use HDWalletProvider')
    networks[argv.network].provider = function () {
      return new HDWalletProvider({
        privateKeys: [''],
        providerOrUrl: fornoUrls[argv.network],
      })
    }
  } else {
    networks[argv.network].provider = function () {
      return new Web3.providers.HttpProvider(fornoUrls[argv.network])
    }
  }
}

module.exports = { networks: networks }
