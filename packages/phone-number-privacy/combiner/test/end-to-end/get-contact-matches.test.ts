import { newKitFromWeb3 } from '@celo/contractkit'
import { PhoneNumberUtils } from '@celo/utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import 'isomorphic-fetch'
import Web3 from 'web3'
import config from '../../src/config'

require('dotenv').config()

const PHONE_NUM_PRIVACY_SERVICE = process.env.PHONE_NUM_PRIVACY_COMBINER_SERVICE_URL
const CONTACT_MATCHES_ENDPOINT = '/getContactMatches'

const PRIVATE_KEY2 = 'ba360ff33f7b4536fe50970cfe5dda63f821e36348da9558c720cc8d9c240701'
const ACCOUNT_ADDRESS2 = privateKeyToAddress(PRIVATE_KEY2)
const PHONE_NUMBER = '+15555555555'
const CONTACT_PHONE_NUMBER = '1234567890'
const CONTACT_PHONE_NUMBERS = [CONTACT_PHONE_NUMBER]
const IDENTIFIER = PhoneNumberUtils.getPhoneHash(PHONE_NUMBER)
const DEFAULT_FORNO_URL = config.blockchain.provider

describe('Running against a deployed service', () => {
  it('Address salt querying fails with account with 0 CELO', async () => {
    const response = await postToSignMessage(
      PHONE_NUMBER,
      CONTACT_PHONE_NUMBERS,
      PRIVATE_KEY2,
      ACCOUNT_ADDRESS2
    )
    expect(response.status).toBe(403)
  })
})

async function postToSignMessage(
  userPhoneNumber: string,
  contactPhoneNumbers: string[],
  privateKey: string,
  account: string,
  authHeader?: string
): Promise<Response> {
  const body = JSON.stringify({
    userPhoneNumber,
    contactPhoneNumbers,
    account,
    hashedPhoneNumber: IDENTIFIER,
  })
  if (!authHeader) {
    const web3 = new Web3(new Web3.providers.HttpProvider(DEFAULT_FORNO_URL))
    const contractKit = newKitFromWeb3(web3)
    contractKit.addAccount(privateKey)
    authHeader = await contractKit.web3.eth.sign(body, account)
  }

  const res = await fetch(PHONE_NUM_PRIVACY_SERVICE + CONTACT_MATCHES_ENDPOINT, {
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
