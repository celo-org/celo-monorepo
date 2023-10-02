const SOLC_VERSION = '0.8.19'

const parent = require('./truffle-config-parent.js')
const flakeTrackingConfig = require('@celo/flake-tracker/src/mocha/config.js')
const networks = { ...parent.networks }
const { celoScanApiKey } = require('./.env.json')

console.log(`Using truffle version for Solidity ${SOLC_VERSION}`)

module.exports = {
  plugins: ['truffle-plugin-verify'],
  api_keys: {
    celoscan: celoScanApiKey,
  },
  compilers: {
    solc: {
      version: SOLC_VERSION,
      settings: {
        metadata: { useLiteralContent: true },
      },
    },
  },
  networks,
  mocha: flakeTrackingConfig,
}

if (process.argv.includes('--gas')) {
  module.exports = {
    compilers: {
      solc: {
        version: SOLC_VERSION,
        settings: {
          metadata: { useLiteralContent: true },
        },
      },
    },
    plugins: ['truffle-plugin-verify'],
    api_keys: {
      celoscan: celoScanApiKey,
    },
    networks,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
    },
  }
}
