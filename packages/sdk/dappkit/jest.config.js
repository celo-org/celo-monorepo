const { defaults: tsjPreset } = require('ts-jest/presets')
const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  ...tsjPreset,
  globals: {
    navigator: true,
    'ts-jest': {
      babelConfig: true,
      isolatedModules: true,
    },
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/(.*)/node_modules/react-native'],
  preset: 'react-native',
  ...nodeFlakeTracking,
  setupFilesAfterEnv: [...nodeFlakeTracking.setupFilesAfterEnv],
}
