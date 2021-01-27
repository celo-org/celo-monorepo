const { nodeFlakeTracking } = require('@celo/flake-tracker/src/jest/config.js')

module.exports = {
  preset: 'ts-jest',
  ...nodeFlakeTracking,
  setupFiles: ['dotenv/config'],
}
