const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
  setupFilesAfterEnv: [...nodeFlakeTracking.setupFilesAfterEnv],
  coverageReporters: [['lcov', { projectRoot: '../../../' }], 'text'],
  collectCoverageFrom: ['./src/**'],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
}
