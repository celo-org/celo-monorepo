import { FetchMockSandbox } from 'fetch-mock'

const fetchMockSandbox = require('fetch-mock').sandbox()
jest.mock('cross-fetch', () => fetchMockSandbox)

// @ts-ignore
global.fetchMock = fetchMockSandbox as FetchMockSandbox
