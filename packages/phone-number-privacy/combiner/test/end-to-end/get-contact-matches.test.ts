import { OdisUtils } from '@celo/contractkit'
import { ErrorMessages } from '@celo/contractkit/lib/identity/odis/query'
import 'isomorphic-fetch'
import {
  ACCOUNT_ADDRESS,
  ACCOUNT_ADDRESS_NO_QUOTA,
  CONTACT_PHONE_NUMBERS,
  PHONE_HASH_IDENTIFIER,
  PHONE_NUMBER,
  SERVICE_CONTEXT,
  walletAuthSigner,
} from './resources'

require('dotenv').config()

jest.setTimeout(15000)

describe('Running against a deployed service', () => {
  it('Returns input error for invalid phone hash', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        'invalid-phone-hash',
        walletAuthSigner,
        SERVICE_CONTEXT
      )
    ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
  })

  it('Returns error when querying fails with an empty account', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS_NO_QUOTA,
        PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Returns error when querying fails with an unverified account', async () => {
    // For this test to be valid, ACCOUNT_ADDRESS must have some balance,
    // which is already required for the get-blinded-sig e2e test.
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })
})
