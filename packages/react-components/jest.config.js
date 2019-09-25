const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  collectCoverageFrom: ['**/*.ts?(x)', '!**/*.d.ts'],
  globals: {
    navigator: true,
    'ts-jest': {
      // Disables type-check when running tests as it takes valuable time
      // and is redundant with the tsc build step
      isolatedModules: true,
    },
    window: true,
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/(.*)/node_modules/react-native'],
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest_setup'],
  transformIgnorePatterns: ['node_modules/(?!(@celo/)?react-native|@react-navigation)'],
}
