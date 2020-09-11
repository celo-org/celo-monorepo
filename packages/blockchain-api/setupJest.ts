import * as fetch from 'jest-fetch-mock'

jest.setMock('node-fetch', fetch)

const customGlobal = (global as unknown) as fetch.GlobalWithFetchMock
customGlobal.fetch = require('jest-fetch-mock')
customGlobal.fetchMock = global.fetch
