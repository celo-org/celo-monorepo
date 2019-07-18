const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  globals: {
    navigator: true,
    window: true,
  },
  preset: './node_modules/react-native-web/jest-preset.js',
  testEnvironment: 'node',
}
