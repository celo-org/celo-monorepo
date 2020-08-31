const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
  setupFilesAfterEnv: ['<rootDir>/jest_setup.ts', ...nodeFlakeTracking.setupFilesAfterEnv],
}
