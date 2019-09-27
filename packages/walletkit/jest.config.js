const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  globals: {
    navigator: true,
    window: true,
  },
  moduleNameMapper: {
    '@celo/mobile': '<rootDir>',
    '^crypto-js$': '<rootDir>/node_modules/crypto-js',
  },
}
