const SOLC_VERSION = '0.5.13'

const parent = require('./truffle-config-parent.js')
const flakeTrackingConfig = require('@celo/flake-tracker/src/mocha/config.js')
const networks = { ...parent.networks }

console.log(`Using truffle version for Solidity ${SOLC_VERSION}`)

module.exports = {
  plugins: ['truffle-security', 'truffle-plugin-blockscout-verify'],
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
  mocha: flakeTrackingConfig,
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
    plugins: ['truffle-security', 'truffle-plugin-blockscout-verify'],
    networks,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
    },
  }
}
