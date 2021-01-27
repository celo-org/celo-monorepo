const {
  numRetries,
  shouldLogRetryErrorsOnFailure,
  shouldSkipKnownFlakes,
  shouldTrackFlakes,
} = require('../config')

const base = {
  // No flake tracking
  setupFilesAfterEnv: [],
  testRunner: 'jest-circus/runner',
}

const flakeTracking = {
  ...base,
  globalSetup: require.resolve('./setup.global.js'),
  globalTeardown: require.resolve('./teardown.global.js'),
  setupFilesAfterEnv: [require.resolve('./setup.js')],
}

const nodeFlakeTracking = shouldTrackFlakes
  ? {
      ...flakeTracking,
      testEnvironment: require.resolve('./environments/node'),
    }
  : {
      ...base,
      testEnvironment: 'node',
    }

const jsdomFlakeTracking = shouldTrackFlakes //TODO(Alec): check that jsdom tests are covered
  ? {
      ...flakeTracking,
      testEnvironment: require.resolve('./environments/jsdom'),
    }
  : {
      ...base,
      testEnvironment: 'jsdom',
    }

// Note that detox e2e tests require a config.json file, which means we currently can't use the object below.
// Presumably this will change in future versions of detox, so we've added this here anyway.
const detoxFlakeTracking = shouldTrackFlakes
  ? {
      ...flakeTracking,
      testEnvironment: require.resolve('./environments/detox'),
    }
  : {
      ...base,
      testEnvironment: 'node',
    }

module.exports = {
  detoxFlakeTracking: detoxFlakeTracking,
  jsdomFlakeTracking: jsdomFlakeTracking,
  nodeFlakeTracking: nodeFlakeTracking,
  numRetries: numRetries,
  shouldLogRetryErrorsOnFailure: shouldLogRetryErrorsOnFailure,
  shouldSkipKnownFlakes: shouldSkipKnownFlakes,
  shouldTrackFlakes: shouldTrackFlakes,
}
