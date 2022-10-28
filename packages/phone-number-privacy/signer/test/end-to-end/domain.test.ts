import { SignerEndpoint } from '@celo/phone-number-privacy-common'
import 'isomorphic-fetch'
import { getVersion } from '../../src/config'

require('dotenv').config()

jest.setTimeout(60000)

const signerUrl = process.env.ODIS_SIGNER_SERVICE_URL
const expectedVersion = getVersion()

describe(`Running against service deployed at ${signerUrl}`, () => {
  it('Service is deployed at correct version', async () => {
    const response = await fetch(signerUrl + SignerEndpoint.STATUS, {
      method: 'GET',
    })
    expect(response.status).toBe(200)
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(body.version).toBe(expectedVersion)
  })

  describe(`${SignerEndpoint.DISABLE_DOMAIN}`, () => {
    // TODO
  })

  describe(`${SignerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    // TODO
  })

  describe(`${SignerEndpoint.DOMAIN_SIGN}`, () => {
    // TODO
  })
})
