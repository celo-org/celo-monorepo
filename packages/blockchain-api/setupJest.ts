import * as fetch from 'jest-fetch-mock'

jest.setMock('node-fetch', fetch)

const customGlobal = global
customGlobal.fetch = require('jest-fetch-mock')
// @ts-ignore
customGlobal.fetchMock = customGlobal.fetch
