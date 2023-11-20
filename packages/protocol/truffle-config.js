const SOLC_VERSION = '0.5.13'

const parent = require('./truffle-config-parent.js')
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
        evmVersion: 'istanbul',
      },
    },
  },
  networks,
}

if (process.argv.includes('--gas')) {
  module.exports = {
    compilers: {
      solc: {
        version: SOLC_VERSION,
        settings: {
          metadata: { useLiteralContent: true },
          evmVersion: 'istanbul',
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
