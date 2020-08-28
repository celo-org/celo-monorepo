const fetchMock = require('fetch-mock').sandbox()
jest.mock('cross-fetch', () => fetchMock)

// @ts-ignore
global.fetchMock = fetchMock
