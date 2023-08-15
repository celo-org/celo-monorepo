// Agarrar a mano las variables que importan

// export * from './truffle-config-parent.js'

// const fs = require('fs')

// Hack to import all the variables of parent

// let parentFile = fs.readFileSync('./truffle-config-parent.js', 'utf8')

// console.log('parentFile', parentFile)
// eval(parentFile)

parent = require('./truffle-config-parent.js')
networks = parent.networks
// import networks from

const SOLC_VERSION = '0.5.13'
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
