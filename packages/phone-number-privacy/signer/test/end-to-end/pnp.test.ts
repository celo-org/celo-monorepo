import { newKit } from '@celo/contractkit'
import {
  KEY_VERSION_HEADER,
  PnpQuotaResponse,
  SignerEndpoint,
  TestUtils,
} from '@celo/phone-number-privacy-common'
import 'isomorphic-fetch'
import { config, getVersion } from '../../src/config'

require('dotenv').config()

const { IDENTIFIER, PRIVATE_KEY1, PRIVATE_KEY2, PRIVATE_KEY3 } = TestUtils.Values

const ODIS_SIGNER_URL = process.env.ODIS_SIGNER_SERVICE_URL
// const ODIS_PUBLIC_POLYNOMIAL = process.env.ODIS_PUBLIC_POLYNOMIAL as string
const ODIS_KEY_VERSION = (process.env.ODIS_KEY_VERSION || 1) as string

const DEFAULT_FORNO_URL = config.blockchain.provider

const kit = newKit(DEFAULT_FORNO_URL)
kit.addAccount(PRIVATE_KEY1)
kit.addAccount(PRIVATE_KEY2)
kit.addAccount(PRIVATE_KEY3)

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

  describe(`${SignerEndpoint.PNP_QUOTA}`, () => {
    it('Should respond with 200 on valid request', async () => {
      // TODO
      // const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
      // const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      // const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
      // expect(res.status).toBe(200)
      // expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
      //   success: true,
      //   version: res.body.version,
      //   performedQueryCount: 0,
      //   totalQuota: expectedQuota,
      //   blockNumber: testBlockNumber,
      //   warnings: [],
      // })
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      // TODO
      // const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
      // const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      // const res1 = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
      // expect(res1.status).toBe(200)
      // expect(res1.body).toStrictEqual<PnpQuotaResponseSuccess>({
      //   success: true,
      //   version: res1.body.version,
      //   performedQueryCount: 0,
      //   totalQuota: expectedQuota,
      //   blockNumber: testBlockNumber,
      //   warnings: [],
      // })
      // const res2 = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
      // expect(res2.status).toBe(200)
      // expect(res2.body).toStrictEqual<PnpQuotaResponseSuccess>(res1.body)
    })

    it('Should respond with 200 on valid request when authenticated with DEK', async () => {
      // TODO
      // const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, AuthenticationMethod.ENCRYPTION_KEY)
      // const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
      // const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
      // expect(res.status).toBe(200)
      // expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
      //   success: true,
      //   version: res.body.version,
      //   performedQueryCount: 0,
      //   totalQuota: expectedQuota,
      //   blockNumber: testBlockNumber,
      //   warnings: [],
      // })
    })

    it('Should respond with 200 on extra request fields', async () => {
      // TODO
      // const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
      // // @ts-ignore Intentionally adding an extra field to the request type
      // req.extraField = 'dummyString'
      // const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      // const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
      // expect(res.status).toBe(200)
      // expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
      //   success: true,
      //   version: expectedVersion,
      //   performedQueryCount: 0,
      //   totalQuota: expectedQuota,
      //   blockNumber: testBlockNumber,
      //   warnings: [],
      // })
    })
    // TODO
  })

  describe(`${SignerEndpoint.PNP_SIGN}`, () => {
    // TODO
  })
})

async function queryQuotaEndpoint(
  account: string,
  // TODO EN: update this
  hashedPhoneNumber?: string,
  authHeader?: string
): Promise<PnpQuotaResponse> {
  // TODO EN update this
  const body = JSON.stringify({
    account,
    hashedPhoneNumber,
  })

  // TODO EN: update this
  const authorization = authHeader || (await kit.connection.sign(body, account))

  const res = await fetch(ODIS_SIGNER_URL + SignerEndpoint.PNP_QUOTA, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body,
  })

  return res.json()
}

async function postToSignMessage(
  // TODO EN: update the params needed for this
  base64BlindedMessage: string,
  account: string,
  timestamp?: number,
  authHeader?: string,
  keyVersion: string = ODIS_KEY_VERSION
): Promise<Response> {
  const body = JSON.stringify({
    hashedPhoneNumber: IDENTIFIER,
    blindedQueryPhoneNumber: base64BlindedMessage.trim(),
    account,
    timestamp,
  })

  const authorization = authHeader || (await kit.connection.sign(body, account))

  const res = await fetch(ODIS_SIGNER_URL + SignerEndpoint.PNP_SIGN, {
    method: 'POST',
    // TODO EN: look at updating these using existing types or whatever
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization,
      [KEY_VERSION_HEADER]: keyVersion,
    },
    body,
  })

  return res
}
