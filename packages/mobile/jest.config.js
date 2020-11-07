const reactNativeJestPreset = require('react-native/jest-preset')
const { defaults: tsjPreset } = require('ts-jest/presets')
const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  ...tsjPreset,
  globals: {
    navigator: true,
    'ts-jest': {
      babelConfig: true,
      // Disables type-check when running tests as it takes valuable time
      // and is redundant with the tsc build step
      isolatedModules: true,
      tsConfig: 'tsconfig.test.json',
    },
    window: true,
  },
  haste: {
    ...reactNativeJestPreset.haste,
    defaultPlatform: 'android',
  },
  moduleNameMapper: {
    '@celo/mobile': '<rootDir>',
    '^crypto-js$': '<rootDir>/../../node_modules/crypto-js',
    // Jest isn't able to use the react-native field of package.json and tries to use the main field
    // which then causes other import errors
    'react-native-bip39': '<rootDir>/../../node_modules/react-native-bip39/src',
    'react-native-svg': '<rootDir>/../../node_modules/react-native-svg-mock',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/(.*)/node_modules/react-native'],
  preset: 'react-native',
  ...nodeFlakeTracking,
  setupFilesAfterEnv: [
    '<rootDir>/jest_setup.ts',
    '<rootDir>/../../node_modules/react-native-gesture-handler/jestSetup.js',
    ...nodeFlakeTracking.setupFilesAfterEnv,
  ],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e'],
  transform: {
    ...tsjPreset.transform,
    '\\.js$': '<rootDir>/../../node_modules/react-native/jest/preprocessor.js',
    '^.+\\.(txt)$': require.resolve(
      '<rootDir>/../../node_modules/react-native/jest/assetFileTransformer.js'
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@celo/)?react-native|@react-navigation|@react-native-community|@react-native-firebase|react-navigation|redux-persist|date-fns|victory-*)',
  ],
}
