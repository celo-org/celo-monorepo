import { sleep } from '@celo/base'
import { newKit, StableToken } from '@celo/contractkit'
import {
  AuthenticationMethod,
  KEY_VERSION_HEADER,
  PnpQuotaRequest,
  PnpQuotaResponseFailure,
  PnpQuotaResponseSuccess,
  SignerEndpoint,
  SignMessageRequest,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import threshold_bls from 'blind-threshold-bls'
import { randomBytes } from 'crypto'
import 'isomorphic-fetch'
import { config } from '../../src/config'
import { getBlindedPhoneNumber, getTestParamsForContext } from './utils'

require('dotenv').config()

const {
  ACCOUNT_ADDRESS1, // zero OdisPayments balance/quota
  ACCOUNT_ADDRESS2, // non-zero OdisPayments balance/quota
  DEK_PRIVATE_KEY,
  DEK_PUBLIC_KEY,
  PHONE_NUMBER,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  PRIVATE_KEY3,
} = TestUtils.Values
const { getPnpQuotaRequest, getPnpRequestAuthorization, getPnpSignRequest } = TestUtils.Utils

const ODIS_SIGNER_URL = process.env.ODIS_SIGNER_SERVICE_URL
const contextSpecificParams = getTestParamsForContext()

const kit = newKit(contextSpecificParams.blockchainProviderURL)
kit.addAccount(PRIVATE_KEY1)
kit.addAccount(PRIVATE_KEY2)
kit.addAccount(PRIVATE_KEY3)

jest.setTimeout(60000)

const expectedVersion = process.env.DEPLOYED_SIGNER_SERVICE_VERSION!

describe(`Running against service deployed at ${ODIS_SIGNER_URL}`, () => {
  const singleQueryCost = config.quota.queryPriceInCUSD.times(1e18).toString()

  beforeAll(async () => {
    const accountsWrapper = await kit.contracts.getAccounts()
    if ((await accountsWrapper.getDataEncryptionKey(ACCOUNT_ADDRESS2)) !== DEK_PUBLIC_KEY) {
      await accountsWrapper
        .setAccountDataEncryptionKey(DEK_PUBLIC_KEY)
        .sendAndWaitForReceipt({ from: ACCOUNT_ADDRESS2 })
    }
  })

  it('Service is deployed at correct version', async () => {
    const response = await fetch(ODIS_SIGNER_URL + SignerEndpoint.STATUS, {
      method: 'GET',
    })
    expect(response.status).toBe(200)
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(body.version).toBe(expectedVersion)
  })

  describe(`${SignerEndpoint.PNP_QUOTA}`, () => {
    it('Should respond with 200 on valid request', async () => {
      const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await queryPnpQuotaEndpoint(req, authorization)
      expect(res.status).toBe(200)
      const resBody: PnpQuotaResponseSuccess = await res.json()
      expect(resBody).toEqual<PnpQuotaResponseSuccess>({
        success: true,
        version: expectedVersion,
        performedQueryCount: 0,
        totalQuota: 0,
        warnings: [],
      })
    })

    it('Should respond with 200 on valid request when authenticated with DEK', async () => {
      const req = getPnpQuotaRequest(ACCOUNT_ADDRESS2, AuthenticationMethod.ENCRYPTION_KEY)
      const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
      const res = await queryPnpQuotaEndpoint(req, authorization)
      expect(res.status).toBe(200)
      const resBody: PnpQuotaResponseSuccess = await res.json()
      expect(resBody).toEqual<PnpQuotaResponseSuccess>({
        success: true,
        version: expectedVersion,
        performedQueryCount: resBody.performedQueryCount,
        totalQuota: resBody.totalQuota,
        warnings: [],
      })
      expect(resBody.totalQuota).toBeGreaterThan(0)
    })

    it('Should respond with 200 and more quota after payment sent to OdisPayments.sol', async () => {
      const req = getPnpQuotaRequest(ACCOUNT_ADDRESS2)
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY2)
      const res = await queryPnpQuotaEndpoint(req, authorization)
      expect(res.status).toBe(200)

      const resBody: PnpQuotaResponseSuccess = await res.json()

      await sendCUSDToOdisPayments(singleQueryCost, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS2)

      const res2 = await queryPnpQuotaEndpoint(req, authorization)
      expect(res2.status).toBe(200)
      const res2Body: PnpQuotaResponseSuccess = await res2.json()
      expect(res2Body).toEqual<PnpQuotaResponseSuccess>({
        success: true,
        version: expectedVersion,
        performedQueryCount: resBody.performedQueryCount,
        totalQuota: resBody.totalQuota,
        warnings: [],
      })

      await sleep(5 * 1000) // sleep for cache ttl

      const res3 = await queryPnpQuotaEndpoint(req, authorization)
      expect(res3.status).toBe(200)
      const res3Body: PnpQuotaResponseSuccess = await res3.json()
      expect(res3Body).toEqual<PnpQuotaResponseSuccess>({
        success: true,
        version: expectedVersion,
        performedQueryCount: resBody.performedQueryCount,
        totalQuota: resBody.totalQuota + 1, // req2 updated the cache, but stale value was returned
        warnings: [],
      })
    })

    it('Should respond with 400 on missing request fields', async () => {
      const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
      // @ts-ignore Intentionally deleting required field
      delete badRequest.account
      const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
      const res = await queryPnpQuotaEndpoint(badRequest, authorization)
      expect(res.status).toBe(400)
      const resBody: PnpQuotaResponseFailure = await res.json()
      expect(resBody).toEqual<PnpQuotaResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 401 on failed WALLET_KEY auth', async () => {
      const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS2, AuthenticationMethod.WALLET_KEY)
      const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
      const res = await queryPnpQuotaEndpoint(badRequest, authorization)
      expect(res.status).toBe(401)
      const resBody: PnpQuotaResponseFailure = await res.json()
      expect(resBody).toEqual<PnpQuotaResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })

    it('Should respond with 401 on failed DEK auth when DEK is set for account', async () => {
      const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS2, AuthenticationMethod.ENCRYPTION_KEY)
      const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY2)
      const res = await queryPnpQuotaEndpoint(badRequest, authorization)
      expect(res.status).toBe(401)
      const resBody: PnpQuotaResponseFailure = await res.json()
      expect(resBody).toEqual<PnpQuotaResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })

    it('Should respond with 401 on failed DEK auth when DEK is not set for account', async () => {
      const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS1, AuthenticationMethod.ENCRYPTION_KEY)
      const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
      const res = await queryPnpQuotaEndpoint(badRequest, authorization)
      expect(res.status).toBe(401)
      const resBody: PnpQuotaResponseFailure = await res.json()
      expect(resBody).toEqual<PnpQuotaResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })
  })

  describe(`${SignerEndpoint.PNP_SIGN}`, () => {
    describe('success cases', () => {
      let startingPerformedQueryCount: number

      beforeEach(async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS2)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY2)
        const res = await queryPnpQuotaEndpoint(req, authorization)
        expect(res.status).toBe(200)
        const resBody: PnpQuotaResponseSuccess = await res.json()
        startingPerformedQueryCount = resBody.performedQueryCount
      })

      it('[Signer configuration test] Should respond with 200 on valid request', async () => {
        const blindedMessage = getBlindedPhoneNumber(PHONE_NUMBER, randomBytes(32))
        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS2,
          blindedMessage,
          AuthenticationMethod.WALLET_KEY
        )
        await sendCUSDToOdisPayments(singleQueryCost, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS2)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY2)
        const res = await queryPnpSignEndpoint(req, authorization)
        expect(res.status).toBe(200)
        const resBody: SignMessageResponseSuccess = await res.json()
        expect(resBody).toEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: resBody.signature,
          performedQueryCount: startingPerformedQueryCount + 1,
          totalQuota: resBody.totalQuota,
          warnings: [],
        })
        expect(res.headers.get(KEY_VERSION_HEADER)).toEqual(contextSpecificParams.pnpKeyVersion)
        expect(
          threshold_bls.partialVerifyBlindSignature(
            Buffer.from(contextSpecificParams.pnpPolynomial, 'hex'),
            Buffer.from(blindedMessage, 'base64'),
            Buffer.from(resBody.signature, 'base64')
          )
        )
      })

      it(`Should respond with 200 on valid request with key version ${contextSpecificParams.pnpKeyVersion}`, async () => {
        // This value can also be modified but needs to be manually inspected in the signer logs
        // (on staging) since a valid key version that does not exist in the keystore
        // will default to the secretName stored in `KEYSTORE_AZURE_SECRET_NAME`
        const keyVersion = contextSpecificParams.pnpKeyVersion
        const blindedMessage = getBlindedPhoneNumber(PHONE_NUMBER, randomBytes(32))
        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS2,
          blindedMessage,
          AuthenticationMethod.WALLET_KEY
        )
        await sendCUSDToOdisPayments(singleQueryCost, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS2)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY2)
        const res = await queryPnpSignEndpoint(req, authorization, keyVersion)
        expect(res.status).toBe(200)
        const resBody: SignMessageResponseSuccess = await res.json()
        expect(resBody).toEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: resBody.signature,
          performedQueryCount: startingPerformedQueryCount + 1,
          totalQuota: resBody.totalQuota,
          warnings: [],
        })
        expect(res.headers.get(KEY_VERSION_HEADER)).toEqual(keyVersion)
        expect(
          threshold_bls.partialVerifyBlindSignature(
            Buffer.from(contextSpecificParams.pnpPolynomial, 'hex'),
            Buffer.from(blindedMessage, 'base64'),
            Buffer.from(resBody.signature, 'base64')
          )
        )
      })

      it('Should respond with 200 and warning on repeated valid requests', async () => {
        await sendCUSDToOdisPayments(singleQueryCost, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS2)
        const blindedMessage = getBlindedPhoneNumber(PHONE_NUMBER, randomBytes(32))
        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS2,
          blindedMessage,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY2)
        const res = await queryPnpSignEndpoint(req, authorization)
        expect(res.status).toBe(200)
        const resBody: SignMessageResponseSuccess = await res.json()
        expect(resBody).toEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: resBody.signature,
          performedQueryCount: startingPerformedQueryCount + 1,
          totalQuota: resBody.totalQuota,
          warnings: [],
        })
        expect(res.headers.get(KEY_VERSION_HEADER)).toEqual(contextSpecificParams.pnpKeyVersion)
        expect(
          threshold_bls.partialVerifyBlindSignature(
            Buffer.from(contextSpecificParams.pnpPolynomial, 'hex'),
            Buffer.from(blindedMessage, 'base64'),
            Buffer.from(resBody.signature, 'base64')
          )
        )

        await sleep(5 * 1000) // sleep for cache ttl

        const res2 = await queryPnpSignEndpoint(req, authorization)
        expect(res2.status).toBe(200)
        const res2Body: SignMessageResponseSuccess = await res2.json()
        expect(res2Body).toEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: resBody.signature,
          performedQueryCount: resBody.performedQueryCount, // Not incremented
          totalQuota: resBody.totalQuota + 1, // prev request updated cache
          warnings: [WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG],
        })
      })
    })

    describe('failure cases', () => {
      const blindedMessage = getBlindedPhoneNumber(PHONE_NUMBER, randomBytes(32))

      it('Should respond with 400 on missing request fields', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS2,
          blindedMessage,
          AuthenticationMethod.WALLET_KEY
        )
        // @ts-ignore Intentionally deleting required field
        delete badRequest.blindedQueryPhoneNumber
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await queryPnpSignEndpoint(badRequest, authorization)
        expect(res.status).toBe(400)
        const resBody: SignMessageResponseFailure = await res.json()
        expect(resBody).toEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on on invalid key version', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS2,
          blindedMessage,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await queryPnpSignEndpoint(badRequest, authorization, 'asd')
        expect(res.status).toBe(400)
        const resBody: SignMessageResponseFailure = await res.json()
        expect(resBody).toEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
        })
      })

      it('Should respond with 400 on on invalid blinded message', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS2,
          PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await queryPnpSignEndpoint(badRequest, authorization)
        expect(res.status).toBe(400)
        const resBody: SignMessageResponseFailure = await res.json()
        expect(resBody).toEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid address', async () => {
        const badRequest = getPnpSignRequest(
          '0xnotanaddress',
          blindedMessage,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await queryPnpSignEndpoint(badRequest, authorization)
        expect(res.status).toBe(400)
        const resBody: SignMessageResponseFailure = await res.json()
        expect(resBody).toEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed WALLET_KEY auth', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS2,
          blindedMessage,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await queryPnpSignEndpoint(badRequest, authorization)
        expect(res.status).toBe(401)
        const resBody: SignMessageResponseFailure = await res.json()
        expect(resBody).toEqual<SignMessageResponseFailure>({
          // TODO test if toStrictEqual works after fixing sendFailure<any>
          success: false,
          version: expectedVersion,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 401 on failed DEK auth when DEK is set for account', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS2,
          blindedMessage,
          AuthenticationMethod.ENCRYPTION_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY2)
        const res = await queryPnpSignEndpoint(badRequest, authorization)
        expect(res.status).toBe(401)
        const resBody: SignMessageResponseFailure = await res.json()
        expect(resBody).toEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 401 on failed DEK auth when DEK is not set for account', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          blindedMessage,
          AuthenticationMethod.ENCRYPTION_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await queryPnpSignEndpoint(badRequest, authorization)
        expect(res.status).toBe(401)
        const resBody: SignMessageResponseFailure = await res.json()
        expect(resBody).toEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 403 on out of quota', async () => {
        const quotaReq = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const quotaAuthorization = getPnpRequestAuthorization(quotaReq, PRIVATE_KEY1)
        const quotaRes = await queryPnpQuotaEndpoint(quotaReq, quotaAuthorization)
        expect(quotaRes.status).toBe(200)
        const quotaResBody: PnpQuotaResponseSuccess = await quotaRes.json()
        // Sanity check
        expect(quotaResBody.performedQueryCount).toEqual(quotaResBody.totalQuota)

        const req = getPnpSignRequest(ACCOUNT_ADDRESS1, blindedMessage)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await queryPnpSignEndpoint(req, authorization)
        expect(res.status).toBe(403)
        const resBody: SignMessageResponseFailure = await res.json()
        expect(resBody).toEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.EXCEEDED_QUOTA,
          totalQuota: quotaResBody.totalQuota,
          performedQueryCount: quotaResBody.performedQueryCount,
        })
      })
    })
  })
})

async function queryPnpQuotaEndpoint(
  req: PnpQuotaRequest,
  authorization: string
): Promise<Response> {
  const body = JSON.stringify(req)
  return fetch(ODIS_SIGNER_URL + SignerEndpoint.PNP_QUOTA, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body,
  })
}

async function queryPnpSignEndpoint(
  req: SignMessageRequest,
  authorization: string,
  keyVersion?: string
): Promise<Response> {
  const body = JSON.stringify(req)
  const headers: any = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: authorization,
  }
  if (keyVersion !== undefined) {
    headers[KEY_VERSION_HEADER] = keyVersion
  }
  const res = await fetch(ODIS_SIGNER_URL + SignerEndpoint.PNP_SIGN, {
    method: 'POST',
    headers,
    body,
  })
  return res
}

async function sendCUSDToOdisPayments(
  amountInWei: string | number,
  recipient: string,
  sender: string
) {
  const stableToken = await kit.contracts.getStableToken(StableToken.cUSD)
  const odisPayments = await kit.contracts.getOdisPayments()
  await stableToken
    .approve(odisPayments.address, amountInWei)
    .sendAndWaitForReceipt({ from: sender })
  await odisPayments.payInCUSD(recipient, amountInWei).sendAndWaitForReceipt({ from: sender })
}
