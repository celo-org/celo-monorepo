/* tslint:disable: object-literal-sort-keys */
require('ts-node/register')
const ProviderEngine = require('web3-provider-engine')
const WebsocketSubprovider = require('web3-provider-engine/subproviders/websocket.js')
const { TruffleArtifactAdapter } = require('@0x/sol-trace')
const { CoverageSubprovider } = require('@0x/sol-coverage')

const argv = require('minimist')(process.argv.slice(2), { string: ['truffle_override', 'network'] })

const SOLC_VERSION = '0.5.8'
const ALFAJORES_NETWORKID = 44782

const OG_FROM = '0xfeE1a22F43BeeCB912B5a4912ba87527682ef0fC'
const DEVELOPMENT_FROM = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
const INTEGRATION_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const INTEGRATION_TESTING_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const ALFAJORESSTAING_FROM = '0xf4314cb9046bece6aa54bb9533155434d0c76909'
const ALFAJORES_FROM = '0x456f41406B32c45D59E539e4BBA3D7898c3584dA'
const PILOT_FROM = '0x387bCb16Bfcd37AccEcF5c9eB2938E30d3aB8BF2'
const PILOTSTAGING_FROM = '0x545DEBe3030B570731EDab192640804AC8Cf65CA'

const gasLimit = 8000000

const defaultConfig = {
  host: '127.0.0.1',
  port: 8545,
  network_id: 1101,
  from: OG_FROM,
  gas: gasLimit,
  gasPrice: 100000000000,
}

const freeGasConfig = { ...defaultConfig, ...{ gasPrice: 0 } }

// Here to avoid recreating it each time
let coverageProvider = null

const networks = {
  development: {
    ...defaultConfig,
    from: DEVELOPMENT_FROM,
    gasPrice: 0,
    gas: gasLimit,
    defaultBalance: 1000000,
    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
  },
  coverage: {
    host: 'localhost',
    network_id: '*',
    gasPrice: 0,
    gas: gasLimit,
    from: DEVELOPMENT_FROM,
    provider: function() {
      if (coverageProvider == null) {
        console.log('building provider!')
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
            // tslint:disable-next-line: no-console
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

  // New testnets
  integration: {
    ...defaultConfig,
    from: INTEGRATION_FROM,
  },
  testing: {
    ...defaultConfig,
    from: INTEGRATION_TESTING_FROM,
  },
  // testnet for integration tests
  integrationtesting: {
    ...defaultConfig,
    from: INTEGRATION_TESTING_FROM,
  },
  argentinastaging: freeGasConfig,
  argentinaproduction: freeGasConfig,

  alfajoresstaging: {
    ...defaultConfig,
    from: ALFAJORESSTAING_FROM,
  },

  alfajores: {
    ...defaultConfig,
    network_id: ALFAJORES_NETWORKID,
    from: ALFAJORES_FROM,
  },

  pilot: {
    ...defaultConfig,
    from: PILOT_FROM,
  },
  pilotstaging: {
    ...defaultConfig,
    from: PILOTSTAGING_FROM,
  },
}
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

module.exports = {
  plugins: ['truffle-security'],
  compilers: {
    solc: {
      version: SOLC_VERSION,
    },
  },
  networks,
}

if (process.argv.includes('--gas')) {
  module.exports = {
    compilers: {
      solc: {
        version: '0.5.8',
      },
    },
    plugins: ['truffle-security'],
    networks,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
    },
  }
}
