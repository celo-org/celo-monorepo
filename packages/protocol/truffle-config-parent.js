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

const OG_FROM = '0xfeE1a22F43BeeCB912B5a4912ba87527682ef0fC'
const DEVELOPMENT_FROM = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
const INTEGRATION_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const INTEGRATION_TESTING_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const ALFAJORES_FROM = '0x59A60D2B488154dc5CB48c42347Df222e13C70Ba'
const BAKLAVA_FROM = '0x3e206e0674d5050f7b33e7e79Cace768050eE06f'

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
  maxFeePerGas: 975_000_000_000,
}

function readMnemonic(networkName) {
  dotenv = require('dotenv').config({
    path: require('path').resolve(__dirname, `../../.env.mnemonic.${networkName}`),
  })

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  if (privateKey === undefined || privateKey === null || privateKey === '') {
    console.log(
      `No private key found in .env.mnemonic.${networkName}. Please run "yarn keys:decrypt" in root after escalating perms in Akeyless`
    )
    process.exit(1)
  }

  return process.env.DEPLOYER_PRIVATE_KEY
}

// Here to avoid recreating it each time
let coverageProvider = null

const fornoUrls = {
  alfajores: 'https://alfajores-forno.celo-testnet.org',
  baklava: 'https://baklava-forno.celo-testnet.org',
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
    network_id: 31337, // same as anvil
    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
  },
  rc1: {
    port: 8545,
    from: '0xF3EB910DA09B8AF348E0E5B6636da442cFa79239',
    network_id: 42220,
    gas: gasLimit,
    gasPrice: 100000000000,
    privateKeyAvailable: true,
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
  alfajores: {
    ...defaultConfig,
    network_id: ALFAJORES_NETWORKID,
    from: ALFAJORES_FROM,
    privateKeyAvailable: true,
  },
  baklava: {
    ...defaultConfig,
    from: BAKLAVA_FROM,
    network_id: BAKLAVA_NETWORKID,
    privateKeyAvailable: true,
  },
}

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

if (process.argv.includes('--forno')) {
  console.log('Using forno as RPC')
  if (!fornoUrls[argv.network]) {
    console.log(`Forno URL for network ${argv.network} not known!`)
    process.exit(1)
  }

  networks[argv.network].host = undefined
  networks[argv.network].port = undefined

  if (networks[argv.network].privateKeyAvailable) {
    console.log('Network is supposed to have a private key available, using HDWalletProvider')
    networks[argv.network].provider = function () {
      return new HDWalletProvider({
        privateKeys: [readMnemonic(argv.network)],
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
