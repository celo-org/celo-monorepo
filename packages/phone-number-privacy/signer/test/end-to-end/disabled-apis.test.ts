import {
  DisableDomainRequest,
  disableDomainRequestEIP712,
  DisableDomainResponse,
  DomainIdentifiers,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DomainQuotaStatusResponse,
  DomainRequestTypeTag,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  genSessionID,
  PnpQuotaRequest,
  PnpQuotaResponse,
  SequentialDelayDomain,
  SignerEndpoint,
  SignMessageRequest,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import 'isomorphic-fetch'
import { getSignerVersion } from '../../src/config'

require('dotenv').config()

const { ACCOUNT_ADDRESS1, BLINDED_PHONE_NUMBER, PRIVATE_KEY1 } = TestUtils.Values
const { getPnpRequestAuthorization } = TestUtils.Utils

const ODIS_SIGNER = process.env.ODIS_SIGNER_SERVICE_URL

jest.setTimeout(30000)

const expectedVersion = getSignerVersion()

// These tests should be run when the individual APIs are disabled.
// When run against enabled APIs, they should fail.
describe('Running against a deployed service with disabled APIs', () => {
  beforeAll(() => {
    console.log('ODIS_SIGNER: ' + ODIS_SIGNER)
  })

  it('Service is deployed at correct version', async () => {
    const response = await fetch(ODIS_SIGNER + SignerEndpoint.STATUS, { method: 'GET' })
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(response.status).toBe(200)
    expect(body.version).toBe(expectedVersion)
  })

  describe('when DOMAINS API is disabled', () => {
    const wallet = new LocalWallet()
    wallet.addAccount(PRIVATE_KEY1)
    const walletAddress = wallet.getAccounts()[0]

    const authenticatedDomain: SequentialDelayDomain = {
      name: DomainIdentifiers.SequentialDelay,
      version: '1',
      stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
      address: defined(walletAddress),
      salt: defined('himalayanPink'),
    }

    it(`${SignerEndpoint.DISABLE_DOMAIN} should respond with 503`, async () => {
      const req: DisableDomainRequest<SequentialDelayDomain> = {
        type: DomainRequestTypeTag.DISABLE,
        domain: authenticatedDomain,
        options: {
          signature: noString,
          nonce: noNumber,
        },
        sessionID: defined(genSessionID()),
      }
      req.options.signature = defined(
        await wallet.signTypedData(walletAddress, disableDomainRequestEIP712(req))
      )
      const body = JSON.stringify(req)
      const response = await fetch(ODIS_SIGNER + SignerEndpoint.DISABLE_DOMAIN, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
      })
      expect(response.status).toBe(503)
      const responseBody: DisableDomainResponse = await response.json()
      expect(responseBody).toStrictEqual({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })

    it(`${SignerEndpoint.DOMAIN_QUOTA_STATUS} should respond with 503`, async () => {
      const req: DomainQuotaStatusRequest<SequentialDelayDomain> = {
        type: DomainRequestTypeTag.QUOTA,
        domain: authenticatedDomain,
        options: {
          signature: noString,
          nonce: noNumber,
        },
        sessionID: defined(genSessionID()),
      }
      req.options.signature = defined(
        await wallet.signTypedData(walletAddress, domainQuotaStatusRequestEIP712(req))
      )
      const body = JSON.stringify(req)
      const response = await fetch(ODIS_SIGNER + SignerEndpoint.DOMAIN_QUOTA_STATUS, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
      })
      expect(response.status).toBe(503)
      const responseBody: DomainQuotaStatusResponse = await response.json()
      expect(responseBody).toStrictEqual({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })

    it(`${SignerEndpoint.DOMAIN_SIGN} should respond with 503`, async () => {
      const req: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
        type: DomainRequestTypeTag.SIGN,
        domain: authenticatedDomain,
        options: {
          signature: noString,
          nonce: noNumber,
        },
        // The message shouldn't actually matter here
        blindedMessage: BLINDED_PHONE_NUMBER,
        sessionID: defined(genSessionID()),
      }
      req.options.signature = defined(
        await wallet.signTypedData(walletAddress, domainRestrictedSignatureRequestEIP712(req))
      )
      const body = JSON.stringify(req)
      const response = await fetch(ODIS_SIGNER + SignerEndpoint.DOMAIN_SIGN, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
      })
      expect(response.status).toBe(503)
      const responseBody: DomainQuotaStatusResponse = await response.json()
      expect(responseBody).toStrictEqual({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })
  })

  describe('when PNP API is disabled', () => {
    it(`${SignerEndpoint.PNP_QUOTA} should respond with 503`, async () => {
      const req: PnpQuotaRequest = {
        account: ACCOUNT_ADDRESS1,
      }
      const body = JSON.stringify(req)
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const response = await fetch(ODIS_SIGNER + SignerEndpoint.PNP_QUOTA, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        body,
      })
      expect(response.status).toBe(503)
      const responseBody: PnpQuotaResponse = await response.json()
      expect(responseBody).toStrictEqual({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })

    it(`${SignerEndpoint.PNP_SIGN} should respond with 503`, async () => {
      const req: SignMessageRequest = {
        account: ACCOUNT_ADDRESS1,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
      }
      const body = JSON.stringify(req)
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const response = await fetch(ODIS_SIGNER + SignerEndpoint.PNP_SIGN, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        body,
      })
      expect(response.status).toBe(503)
      const responseBody: PnpQuotaResponse = await response.json()
      expect(responseBody).toStrictEqual({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })
  })

  describe('when LEGACY_PNP API is disabled', () => {
    it(`${SignerEndpoint.LEGACY_PNP_QUOTA} should respond with 503`, async () => {
      const req: PnpQuotaRequest = {
        account: ACCOUNT_ADDRESS1,
      }
      const body = JSON.stringify(req)
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const response = await fetch(ODIS_SIGNER + SignerEndpoint.LEGACY_PNP_QUOTA, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        body,
      })
      expect(response.status).toBe(503)
      const responseBody: PnpQuotaResponse = await response.json()
      expect(responseBody).toStrictEqual({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })

    it(`${SignerEndpoint.LEGACY_PNP_SIGN} should respond with 503`, async () => {
      const req: SignMessageRequest = {
        account: ACCOUNT_ADDRESS1,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
      }
      const body = JSON.stringify(req)
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const response = await fetch(ODIS_SIGNER + SignerEndpoint.LEGACY_PNP_SIGN, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        body,
      })
      expect(response.status).toBe(503)
      const responseBody: PnpQuotaResponse = await response.json()
      expect(responseBody).toStrictEqual({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })
  })
})
