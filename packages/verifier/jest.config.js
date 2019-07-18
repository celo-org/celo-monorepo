const defaultConfig = require('../../jest.config.js')

module.exports = {
  ...defaultConfig,
  globals: {
    navigator: true,
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
  transformIgnorePatterns: ['node_modules/(?!react-native|react-navigation|)'],
}
