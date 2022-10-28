import { CombinerEndpoint } from '@celo/phone-number-privacy-common'
import 'isomorphic-fetch'
import { VERSION } from '../../src/config'

require('dotenv').config()

jest.setTimeout(60000)

const combinerUrl = process.env.ODIS_COMBINER_SERVICE_URL
const fullNodeUrl = process.env.ODIS_BLOCKCHAIN_PROVIDER

describe(`Running against service deployed at ${combinerUrl} w/ blockchain provider ${fullNodeUrl}`, () => {
  it('Service is deployed at correct version', async () => {
    const response = await fetch(combinerUrl + CombinerEndpoint.STATUS, {
      method: 'GET',
    })
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(body.version).toBe(VERSION)
  })

  describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
    // TODO
  })

  describe(`${CombinerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    // TODO
  })

  describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
    // TODO
  })
})
