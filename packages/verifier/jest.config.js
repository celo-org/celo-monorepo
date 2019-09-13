const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  globals: {
    navigator: true,
    'ts-jest': {
      // Disables type-check when running tests as it takes valuable time
      // and is redundant with the tsc build step
      isolatedModules: true,
    },
    window: true,
  },
  moduleNameMapper: {
    '@celo/verifier': '<rootDir>',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/(.*)/node_modules/react-native'],
  preset: 'react-native',
  transform: {
    '\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js)$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(@celo/)?react-native|@react-navigation)'],
}
