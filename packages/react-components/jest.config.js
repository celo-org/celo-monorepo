const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  collectCoverageFrom: ['**/*.ts?(x)', '!**/*.d.ts'],
  globals: {
    navigator: true,
    window: true,
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/(.*)/node_modules/react-native'],
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest_setup'],
  transformIgnorePatterns: ['node_modules/(?!react-native|react-navigation|)'],
}
