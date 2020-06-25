module.exports = {
  globals: {
    FLAKES: Map,
    RETRY_TIMES: 5,
  },
  setupFilesAfterEnv: [require.resolve('./jest.setup.js')],
  testEnvironment: require.resolve('./JestFlakeTrackingEnvironment.js'),
  testRunner: 'jest-circus/runner',
}
