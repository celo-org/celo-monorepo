const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
  setupFiles: ['dotenv/config'],
  coverageReporters: [['lcov', { projectRoot: '../../../' }], 'text'],
  collectCoverageFrom: ['./src/**'],
  coverageThreshold: {
    global: {
      lines: 79, // TODO(2.0.0) make this higher in testing audit ticket (https://github.com/celo-org/celo-monorepo/issues/9811)
    },
  },
}
