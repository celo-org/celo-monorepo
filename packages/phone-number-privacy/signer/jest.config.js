module.exports = {
  preset: 'ts-jest',
  setupFiles: ['dotenv/config'],
  testEnvironment: '../../flakey-test-tracking/lib/JestFlakeTrackingEnvironment.js',
}
