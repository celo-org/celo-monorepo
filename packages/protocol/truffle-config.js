parent = require('./truffle-config-parent.js')
networks = parent.networks

const SOLC_VERSION = '0.5.13'
console.log(`Using truffle version for Solidity ${SOLC_VERSION}`)
console.log('Using old truffle version')

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
  mocha: parent.flakeTrackingConfig,
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
