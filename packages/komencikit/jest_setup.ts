import { enableFetchMocks } from 'jest-fetch-mock'
enableFetchMocks()

// TODO: Remove when a new version of jest-fetch-mock gets released
// See: https://github.com/jefflau/jest-fetch-mock/pull/160
if (typeof DOMException === 'undefined') {
  global.DOMException = require('domexception')
}
