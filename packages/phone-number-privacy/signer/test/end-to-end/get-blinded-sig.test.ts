import { newKitFromWeb3 } from '@celo/contractkit'
import {
  GetQuotaResponse,
  rootLogger as logger,
  TestUtils,
} from '@celo/phone-number-privacy-common'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import 'isomorphic-fetch'
import Web3 from 'web3'
import config from '../../src/config'
import { getWalletAddress } from '../../src/signing/query-quota'

require('dotenv').config()

const {
  ACCOUNT_ADDRESS1,
  ACCOUNT_ADDRESS2,
  ACCOUNT_ADDRESS3,
  BLINDED_PHONE_NUMBER,
  IDENTIFIER,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  PRIVATE_KEY3,
} = TestUtils.Values
const { replenishQuota, registerWalletAddress } = TestUtils.Utils

const ODIS_SIGNER = process.env.ODIS_SIGNER_SERVICE_URL
const SIGN_MESSAGE_ENDPOINT = '/getBlindedMessagePartialSig'
const GET_QUOTA_ENDPOINT = '/getQuota'

const DEFAULT_FORNO_URL = config.blockchain.provider

const web3 = new Web3(new Web3.providers.HttpProvider(DEFAULT_FORNO_URL))
const contractkit = newKitFromWeb3(web3)
contractkit.addAccount(PRIVATE_KEY1)
contractkit.addAccount(PRIVATE_KEY2)
contractkit.addAccount(PRIVATE_KEY3)

jest.setTimeout(30000)

describe('Running against a deployed service', () => {
  describe('Returns status 400 with invalid input', () => {
    it('With invalid address', async () => {
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, '0x1234', Date.now(), 'ignore')
      expect(response.status).toBe(400)
    })

    it('With missing blindedQueryPhoneNumber', async () => {
      const response = await postToSignMessage('', ACCOUNT_ADDRESS1, Date.now())
      expect(response.status).toBe(400)
    })

    it('With invalid blindedQueryPhoneNumber', async () => {
      const response = await postToSignMessage('invalid', ACCOUNT_ADDRESS1, Date.now())
      expect(response.status).toBe(400)
    })
  })

  describe('Returns status 401 with invalid authentication headers', () => {
    it('With invalid auth header', async () => {
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        ACCOUNT_ADDRESS1,
        Date.now(),
        'invalid'
      )
      expect(response.status).toBe(401)
    })

    it('With auth header signer mismatch', async () => {
      const timestamp = Date.now()
      // Sign body with different account
      const body = JSON.stringify({
        hashedPhoneNumber: '+1455556600',
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER.trim(),
        ACCOUNT_ADDRESS1,
        timestamp,
      })
      const signature = signMessage(JSON.stringify(body), PRIVATE_KEY2, ACCOUNT_ADDRESS2)
      const authHeader = serializeSignature(signature)

      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        ACCOUNT_ADDRESS1,
        timestamp,
        authHeader
      )
      expect(response.status).toBe(401)
    })

    it('With missing blindedQueryPhoneNumber', async () => {
      const response = await postToSignMessage('', ACCOUNT_ADDRESS1, Date.now())
      expect(response.status).toBe(400)
    })
  })

  it('Returns error when querying out of quota', async () => {
    const response = await postToSignMessage(BLINDED_PHONE_NUMBER, ACCOUNT_ADDRESS1, Date.now())
    expect(response.status).toBe(403)
  })

  describe('When account address has enough quota', () => {
    // if these tests are failing, it may just be that the address needs to be fauceted:
    // celotooljs account faucet --account ACCOUNT_ADDRESS2 --dollar 1 --gold 1 -e <ENV> --verbose
    let initialQueryCount: number
    let timestamp: number
    beforeAll(async () => {
      console.log('ACCOUNT_ADDRESS1 ' + ACCOUNT_ADDRESS1)
      console.log('ACCOUNT_ADDRESS2 ' + ACCOUNT_ADDRESS2)
      console.log('ACCOUNT_ADDRESS3 ' + ACCOUNT_ADDRESS3)

      contractkit.defaultAccount = ACCOUNT_ADDRESS2

      initialQueryCount = await getQueryCount(ACCOUNT_ADDRESS2, IDENTIFIER)
      timestamp = Date.now()
    })

    it('Returns sig when querying succeeds with unused request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, ACCOUNT_ADDRESS2, timestamp)
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with unused request increments query count', async () => {
      const queryCount = await getQueryCount(ACCOUNT_ADDRESS2, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 1)
    })

    it('Returns sig when querying succeeds with used request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, ACCOUNT_ADDRESS2, timestamp)
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with used request does not increment query count', async () => {
      const queryCount = await getQueryCount(ACCOUNT_ADDRESS2, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 1)
    })

    it('Returns sig when querying succeeds with missing timestamp', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, ACCOUNT_ADDRESS2)
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with missing timestamp increments query count', async () => {
      const queryCount = await getQueryCount(ACCOUNT_ADDRESS2, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 2)
    })
  })

  describe('When walletAddress has enough quota', () => {
    // if these tests are failing, it may just be that the address needs to be fauceted:
    // celotooljs account faucet --account ACCOUNT_ADDRESS2 --dollar 1 --gold 1 -e <ENV> --verbose
    // NOTE: DO NOT FAUCET ACCOUNT_ADDRESS3
    let initialQuota: number
    let initialQueryCount: number
    let timestamp: number
    beforeAll(async () => {
      contractkit.defaultAccount = ACCOUNT_ADDRESS3
      await registerWalletAddress(ACCOUNT_ADDRESS3, ACCOUNT_ADDRESS2, PRIVATE_KEY2, contractkit)
      // ACCOUNT_ADDRESS2 is now the wallet address (has quota)
      // and ACCOUNT_ADDRESS3 is account address (does not have quota on it's own, only bc of walletAddress)
      initialQuota = await getQuota(ACCOUNT_ADDRESS3, IDENTIFIER)
      initialQueryCount = await getQueryCount(ACCOUNT_ADDRESS3, IDENTIFIER)
      timestamp = Date.now()
    })

    it('Check that accounts are set up correctly', async () => {
      expect(await getQuota(ACCOUNT_ADDRESS2, IDENTIFIER)).toBeLessThan(initialQuota)
      expect(await getWalletAddress(logger, ACCOUNT_ADDRESS3)).toBe(ACCOUNT_ADDRESS2)
    })

    it('Returns sig when querying succeeds with unused request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, ACCOUNT_ADDRESS3, timestamp)
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with unused request increments query count', async () => {
      const queryCount = await getQueryCount(ACCOUNT_ADDRESS3, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 1)
    })

    it('Returns sig when querying succeeds with used request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, ACCOUNT_ADDRESS3, timestamp)
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with used request does not increment query count', async () => {
      const queryCount = await getQueryCount(ACCOUNT_ADDRESS3, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 1)
    })

    it('Returns sig when querying succeeds with missing timestamp', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, ACCOUNT_ADDRESS3)
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with missing timestamp increments query count', async () => {
      const queryCount = await getQueryCount(ACCOUNT_ADDRESS3, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 2)
    })
  })
})

async function getQuota(
  account: string,
  hashedPhoneNumber?: string,
  authHeader?: string
): Promise<number> {
  const res = await queryQuotaEndpoint(account, hashedPhoneNumber, authHeader)
  return res.totalQuota
}

async function getQueryCount(
  account: string,
  hashedPhoneNumber?: string,
  authHeader?: string
): Promise<number> {
  const res = await queryQuotaEndpoint(account, hashedPhoneNumber, authHeader)
  return res.performedQueryCount
}

async function queryQuotaEndpoint(
  account: string,
  hashedPhoneNumber?: string,
  authHeader?: string
): Promise<GetQuotaResponse> {
  const body = JSON.stringify({
    account,
    hashedPhoneNumber,
  })

  const authorization = authHeader || (await contractkit.connection.sign(body, account))

  const res = await fetch(ODIS_SIGNER + GET_QUOTA_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body,
  })

  return await res.json()
}

async function postToSignMessage(
  base64BlindedMessage: string,
  account: string,
  timestamp?: number,
  authHeader?: string
): Promise<Response> {
  const body = JSON.stringify({
    hashedPhoneNumber: IDENTIFIER,
    blindedQueryPhoneNumber: base64BlindedMessage.trim(),
    account,
    timestamp,
  })

  const authorization = authHeader || (await contractkit.connection.sign(body, account))

  const res = await fetch(ODIS_SIGNER + SIGN_MESSAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body,
  })

  return res
}
