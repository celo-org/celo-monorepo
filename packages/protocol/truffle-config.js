/* tslint:disable: object-literal-sort-keys */
require('ts-node/register')
const ProviderEngine = require('web3-provider-engine')
const WebsocketSubprovider = require('web3-provider-engine/subproviders/websocket.js')
const { TruffleArtifactAdapter } = require('@0x/sol-trace')
const { CoverageSubprovider } = require('@0x/sol-coverage')

const argv = require('minimist')(process.argv.slice(2), { string: ['truffle_override', 'network'] })

const SOLC_VERSION = '0.5.8'
const ALFAJORES_NETWORKID = 44785

const OG_FROM = '0xfeE1a22F43BeeCB912B5a4912ba87527682ef0fC'
const DEVELOPMENT_FROM = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
const INTEGRATION_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const INTEGRATION_TESTING_FROM = '0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95'
const ALFAJORESSTAGING_FROM = '0xf4314cb9046bece6aa54bb9533155434d0c76909'
const ALFAJORES_FROM = '0x456f41406B32c45D59E539e4BBA3D7898c3584dA'
const PILOT_FROM = '0x387bCb16Bfcd37AccEcF5c9eB2938E30d3aB8BF2'
const PILOTSTAGING_FROM = '0x545DEBe3030B570731EDab192640804AC8Cf65CA'

const ACCOUNT_PRIVATE_KEYS = [
  '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
  '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72',
  '0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1',
  '0xff12e391b79415e941a94de3bf3a9aee577aed0731e297d5cfa0b8a1e02fa1d0',
  '0x752dd9cf65e68cfaba7d60225cbdbc1f4729dd5e5507def72815ed0d8abc6249',
  '0xefb595a0178eb79a8df953f87c5148402a224cdf725e88c0146727c6aceadccd',
  '0x83c6d2cc5ddcf9711a6d59b417dc20eb48afd58d45290099e5987e3d768f328f',
  '0xbb2d3f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2',
  '0xb2fd4d29c1390b71b8795ae81196bfd60293adf99f9d32a0aff06288fcdac55f',
  '0x23cb7121166b9a2f93ae0b7c05bde02eae50d64449b2cbb42bc84e9d38d6cc89',
]
const ACCOUNT_ADDRESSES = [
  '0x5409ED021D9299bf6814279A6A1411A7e866A631',
  '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
  '0xE36Ea790bc9d7AB70C55260C66D52b1eca985f84',
  '0xE834EC434DABA538cd1b9Fe1582052B880BD7e63',
  '0x78dc5D2D739606d31509C31d654056A45185ECb6',
  '0xA8dDa8d7F5310E4A9E24F8eBA77E091Ac264f872',
  '0x06cEf8E666768cC40Cc78CF93d9611019dDcB628',
  '0x4404ac8bd8F9618D27Ad2f1485AA1B2cFD82482D',
  '0x7457d5E02197480Db681D3fdF256c7acA21bDc12',
  '0x91c987bf62D25945dB517BDAa840A6c661374402',
]

const gasLimit = 10000000

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
    defaultBalance: 200000000,
    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
    ACCOUNT_PRIVATE_KEYS,
    ACCOUNT_ADDRESSES,
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
    from: ALFAJORESSTAGING_FROM,
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
  plugins: ['truffle-security', 'truffle-plugin-blockscout-verify'],
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
    plugins: ['truffle-security', 'truffle-plugin-blockscout-verify'],
    networks,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
    },
  }
}
