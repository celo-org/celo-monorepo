const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  globals: {
    navigator: true,
    window: true,
  },
  preset: 'react-native-web',
  testEnvironment: 'node',
}
