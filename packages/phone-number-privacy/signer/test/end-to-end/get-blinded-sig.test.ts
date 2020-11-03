import { newKitFromWeb3 } from '@celo/contractkit'
import { TestUtils } from '@celo/phone-number-privacy-common'
import { PhoneNumberUtils } from '@celo/utils'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import 'isomorphic-fetch'
import Web3 from 'web3'
import config from '../../src/config'
import { GetQuotaResponse, getWalletAddress } from '../../src/signing/query-quota'

require('dotenv').config()

const { replenishQuota, getBlindedPhoneNumber, registerWalletAddress } = TestUtils.Utils

const ODIS_SIGNER = process.env.ODIS_SIGNER_SERVICE_URL
const SIGN_MESSAGE_ENDPOINT = '/getBlindedMessagePartialSig'
const GET_QUOTA_ENDPOINT = '/getQuota'

const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = privateKeyToAddress(PRIVATE_KEY2)
const PRIVATE_KEY3 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff1d'
const ACCOUNT_ADDRESS3 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY3))
const PHONE_NUMBER = '+15555555555'
const IDENTIFIER = PhoneNumberUtils.getPhoneHash(PHONE_NUMBER)
const BLINDING_FACTOR = new Buffer('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64')
const BLINDED_PHONE_NUMBER = getBlindedPhoneNumber(PHONE_NUMBER, BLINDING_FACTOR)
const DEFAULT_FORNO_URL = config.blockchain.provider

const web3 = new Web3(new Web3.providers.HttpProvider(DEFAULT_FORNO_URL))
const contractkit = newKitFromWeb3(web3)
contractkit.addAccount(PRIVATE_KEY1)
contractkit.addAccount(PRIVATE_KEY2)
contractkit.addAccount(PRIVATE_KEY3)

jest.setTimeout(15000)

describe('Running against a deployed service', () => {
  describe('Returns status 400 with invalid input', () => {
    it('With invalid address', async () => {
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        PRIVATE_KEY1,
        '0x1234',
        Date.now(),
        'ignore'
      )
      expect(response.status).toBe(400)
    })

    it('With missing blindedQueryPhoneNumber', async () => {
      const response = await postToSignMessage('', PRIVATE_KEY1, ACCOUNT_ADDRESS1, Date.now())
      expect(response.status).toBe(400)
    })

    xit('With invalid blindedQueryPhoneNumber', async () => {
      // TODO: update input-validation.ts to detect invalid blindedQueryPhoneNumber
      const response = await postToSignMessage(
        'invalid',
        PRIVATE_KEY1,
        ACCOUNT_ADDRESS1,
        Date.now()
      )
      expect(response.status).toBe(400)
    })
  })

  describe('Returns status 401 with invalid authentication headers', () => {
    it('With invalid auth header', async () => {
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        PRIVATE_KEY1,
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
        PRIVATE_KEY1,
        ACCOUNT_ADDRESS1,
        timestamp,
        authHeader
      )
      expect(response.status).toBe(401)
    })

    it('With missing blindedQueryPhoneNumber', async () => {
      const response = await postToSignMessage('', PRIVATE_KEY1, ACCOUNT_ADDRESS1, Date.now())
      expect(response.status).toBe(400)
    })
  })

  it('Returns error when querying out of quota', async () => {
    const response = await postToSignMessage(
      BLINDED_PHONE_NUMBER,
      PRIVATE_KEY1,
      ACCOUNT_ADDRESS1,
      Date.now()
    )
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

      initialQueryCount = await getQueryCount(PRIVATE_KEY2, ACCOUNT_ADDRESS2, IDENTIFIER)
      timestamp = Date.now()
    })

    it('Returns sig when querying succeeds with unused request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        PRIVATE_KEY2,
        ACCOUNT_ADDRESS2,
        timestamp
      )
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with unused request increments query count', async () => {
      const queryCount = await getQueryCount(PRIVATE_KEY2, ACCOUNT_ADDRESS2, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 1)
    })

    it('Returns sig when querying succeeds with used request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        PRIVATE_KEY2,
        ACCOUNT_ADDRESS2,
        timestamp
      )
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with used request does not increment query count', async () => {
      const queryCount = await getQueryCount(PRIVATE_KEY2, ACCOUNT_ADDRESS2, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 1)
    })

    it('Returns sig when querying succeeds with missing timestamp', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, PRIVATE_KEY2, ACCOUNT_ADDRESS2)
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with missing timestamp increments query count', async () => {
      const queryCount = await getQueryCount(PRIVATE_KEY2, ACCOUNT_ADDRESS2, IDENTIFIER)
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
      initialQuota = await getQuota(PRIVATE_KEY3, ACCOUNT_ADDRESS3, IDENTIFIER)
      initialQueryCount = await getQueryCount(PRIVATE_KEY3, ACCOUNT_ADDRESS3, IDENTIFIER)
      timestamp = Date.now()
    })

    it('Check that accounts are set up correctly', async () => {
      // TODO Make this check more precise
      expect(await getQuota(PRIVATE_KEY2, ACCOUNT_ADDRESS2, IDENTIFIER)).toBeLessThan(initialQuota)
      expect(await getWalletAddress(ACCOUNT_ADDRESS3)).toBe(ACCOUNT_ADDRESS2)
    })

    it('Returns sig when querying succeeds with unused request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        PRIVATE_KEY3,
        ACCOUNT_ADDRESS3,
        timestamp
      )
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with unused request increments query count', async () => {
      const queryCount = await getQueryCount(PRIVATE_KEY3, ACCOUNT_ADDRESS3, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 1)
    })

    it('Returns sig when querying succeeds with used request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        PRIVATE_KEY3,
        ACCOUNT_ADDRESS3,
        timestamp
      )
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with used request does not increment query count', async () => {
      const queryCount = await getQueryCount(PRIVATE_KEY3, ACCOUNT_ADDRESS3, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 1)
    })

    it('Returns sig when querying succeeds with missing timestamp', async () => {
      await replenishQuota(ACCOUNT_ADDRESS2, contractkit)
      const response = await postToSignMessage(BLINDED_PHONE_NUMBER, PRIVATE_KEY3, ACCOUNT_ADDRESS3)
      expect(response.status).toBe(200)
    })

    it('Returns count when querying with missing timestamp increments query count', async () => {
      const queryCount = await getQueryCount(PRIVATE_KEY3, ACCOUNT_ADDRESS3, IDENTIFIER)
      expect(queryCount).toEqual(initialQueryCount + 2)
    })
  })
})

async function getQuota(
  privateKey: string,
  account: string,
  hashedPhoneNumber?: string,
  authHeader?: string
): Promise<number> {
  const res = await queryQuotaEndpoint(privateKey, account, hashedPhoneNumber, authHeader)
  return res.totalQuota
}

async function getQueryCount(
  privateKey: string,
  account: string,
  hashedPhoneNumber?: string,
  authHeader?: string
): Promise<number> {
  const res = await queryQuotaEndpoint(privateKey, account, hashedPhoneNumber, authHeader)
  return res.performedQueryCount
}

async function queryQuotaEndpoint(
  privateKey: string,
  account: string,
  hashedPhoneNumber?: string,
  authHeader?: string
): Promise<GetQuotaResponse> {
  const body = JSON.stringify({
    account,
    hashedPhoneNumber,
  })

  const res = await fetch(ODIS_SIGNER + GET_QUOTA_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader || web3.eth.accounts.sign(body, privateKey).signature,
    },
    body,
  })

  return await res.json()
}

async function postToSignMessage(
  base64BlindedMessage: string,
  privateKey: string,
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

  const res = await fetch(ODIS_SIGNER + SIGN_MESSAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader || web3.eth.accounts.sign(body, privateKey).signature,
    },
    body,
  })

  return res
}
