const flakeTrackingConfig = {
  globals: {
    FLAKES: Map,
    RETRY_TIMES: 10,
    SKIP_KNOWN_FLAKES: true && process.env.CI,
  },
  globalSetup: require.resolve('./jest.global.setup.js'),
  setupFilesAfterEnv: [require.resolve('./jest.setup.js')],
  testEnvironment: require.resolve('./JestFlakeTrackingEnvironment.js'),
  testRunner: 'jest-circus/runner',
}

const defaultConfig = {
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
}

module.exports = process.env.CI || process.env.FLAKEY ? flakeTrackingConfig : defaultConfig
