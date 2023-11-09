const SOLC_VERSION = '0.8.19'

const parent = require('./truffle-config-parent.js')
const networks = { ...parent.networks }

console.log(`Using truffle version for Solidity ${SOLC_VERSION}`)

module.exports = {
  plugins: ['truffle-security', 'truffle-plugin-blockscout-verify'],
  compilers: {
    solc: {
      version: SOLC_VERSION,
      settings: {
        metadata: { useLiteralContent: true },
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
