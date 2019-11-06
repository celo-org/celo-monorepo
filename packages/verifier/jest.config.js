const reactNativeJestPreset = require('react-native/jest-preset')
const { defaults: tsjPreset } = require('ts-jest/presets')

module.exports = {
  ...tsjPreset,
  globals: {
    navigator: true,
    'ts-jest': {
      babelConfig: true,
      // Disables type-check when running tests as it takes valuable time
      // and is redundant with the tsc build step
      isolatedModules: true,
    },
    window: true,
  },
  haste: {
    ...reactNativeJestPreset.haste,
    defaultPlatform: 'android',
  },
  moduleNameMapper: {
    '@celo/verifier': '<rootDir>',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/(.*)/node_modules/react-native'],
  preset: 'react-native',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e'],
  transform: {
    ...tsjPreset.transform,
    '\\.js$': '<rootDir>/../../node_modules/react-native/jest/preprocessor.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@celo/)?react-native|@react-navigation|@react-native-community|react-navigation|redux-persist|date-fns)',
  ],
}
