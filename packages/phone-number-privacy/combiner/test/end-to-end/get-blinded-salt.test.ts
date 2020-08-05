import { newKitFromWeb3 } from '@celo/contractkit'
import { PhoneNumberUtils } from '@celo/utils'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import 'isomorphic-fetch'
import Web3 from 'web3'
import { getBlindedPhoneNumber } from '../../../common/test/utils'
import config from '../../src/config'

require('dotenv').config()

const PHONE_NUM_PRIVACY_SERVICE = process.env.PHONE_NUM_PRIVACY_COMBINER_SERVICE_URL
const SIGN_MESSAGE_ENDPOINT = '/getDistributedBlindedSalt'

const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = privateKeyToAddress(PRIVATE_KEY2)
const PHONE_NUMBER = '+15555555555'
const IDENTIFIER = PhoneNumberUtils.getPhoneHash(PHONE_NUMBER)
const BLINDING_FACTOR = new Buffer('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64')
const BLINDED_PHONE_NUMBER = getBlindedPhoneNumber(PHONE_NUMBER, BLINDING_FACTOR)
const DEFAULT_FORNO_URL = config.blockchain.provider

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

    // TODO: Enable test when blindedQueryPhoneNumber input validation is added
    xit('With invalid blindedQueryPhoneNumber', async () => {
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

  it('Address salt querying out of quota', async () => {
    const response = await postToSignMessage(
      BLINDED_PHONE_NUMBER,
      PRIVATE_KEY1,
      ACCOUNT_ADDRESS1,
      Date.now()
    )
    expect(response.status).toBe(403)
  })

  xdescribe('With funded account', () => {
    // TODO: Figure out a common way to prefund account to provide quota
    const timestamp = Date.now()
    it('Address salt querying succeeds with unused request', async () => {
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        PRIVATE_KEY2,
        ACCOUNT_ADDRESS2,
        timestamp
      )
      expect(response.status).toBe(200)
    })

    it('Address salt querying fails with used request', async () => {
      const response = await postToSignMessage(
        BLINDED_PHONE_NUMBER,
        PRIVATE_KEY2,
        ACCOUNT_ADDRESS2,
        timestamp
      )
      expect(response.status).toBe(400)
    })
  })
})

async function postToSignMessage(
  base64BlindedMessage: string,
  privateKey: string,
  account: string,
  timestamp: number,
  authHeader?: string
): Promise<Response> {
  const body = JSON.stringify({
    hashedPhoneNumber: IDENTIFIER,
    blindedQueryPhoneNumber: base64BlindedMessage.trim(),
    account,
    timestamp,
  })
  if (!authHeader) {
    const web3 = new Web3(new Web3.providers.HttpProvider(DEFAULT_FORNO_URL))
    const contractKit = newKitFromWeb3(web3)
    contractKit.addAccount(privateKey)
    authHeader = await contractKit.web3.eth.sign(body, account)
  }

  const res = await fetch(PHONE_NUM_PRIVACY_SERVICE + SIGN_MESSAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body,
  })

  return res
}
