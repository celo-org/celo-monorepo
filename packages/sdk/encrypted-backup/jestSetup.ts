// Setup mock for the fetch API to intercept requests to ODIS and the circuit breaker service.
// cross-fetch is used by the @celo/identity library.
const fetchMockSandbox = require('fetch-mock').sandbox()
jest.mock('cross-fetch', () => fetchMockSandbox)

// @ts-ignore
global.fetchMock = fetchMockSandbox
