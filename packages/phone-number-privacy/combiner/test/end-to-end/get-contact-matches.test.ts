import { OdisUtils } from '@celo/identity/lib/odis'
import { ErrorMessages } from '@celo/identity/lib/odis/query'
import { ensureLeading0x } from '@celo/utils/lib/address'
import 'isomorphic-fetch'
import { E2E_TEST_ACCOUNTS, E2E_TEST_PHONE_NUMBERS_RAW } from '../../src/config'
import {
  ACCOUNT_ADDRESS,
  CONTACT_PHONE_NUMBERS,
  contractKit,
  dekAuthSigner,
  deks,
  PHONE_HASH_IDENTIFIER,
  PHONE_NUMBER,
  SERVICE_CONTEXT,
  walletAuthSigner,
} from './resources'

require('dotenv').config()

jest.setTimeout(60000)

describe('Running against a deployed service', () => {
  it('Returns input error for invalid phone hash', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        'invalid-phone-hash',
        walletAuthSigner,
        SERVICE_CONTEXT,
        dekAuthSigner(0)
      )
    ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
  })

  it('Returns error when querying with an unauthenticated request', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        PHONE_HASH_IDENTIFIER,
        { ...dekAuthSigner(0), rawKey: 'fake' },
        SERVICE_CONTEXT
      )
    ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
  })

  it('Returns error when querying with an unverified account', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT,
        dekAuthSigner(0)
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Returns error when querying with invalid DEK', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        E2E_TEST_PHONE_NUMBERS_RAW[0],
        CONTACT_PHONE_NUMBERS,
        E2E_TEST_ACCOUNTS[0],
        PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT,
        { ...dekAuthSigner(0), rawKey: 'fake' }
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  describe('When requerying matches', () => {
    beforeAll(async () => {
      // set DEK
      const accounts = await contractKit.contracts.getAccounts()
      await accounts
        .setAccountDataEncryptionKey(ensureLeading0x(deks[0].publicKey))
        .sendAndWaitForReceipt()
    })

    it('Returns success when requerying with same phone number and valid DEK', async () => {
      await expect(
        OdisUtils.Matchmaking.getContactMatches(
          E2E_TEST_PHONE_NUMBERS_RAW[0],
          CONTACT_PHONE_NUMBERS,
          E2E_TEST_ACCOUNTS[0],
          PHONE_HASH_IDENTIFIER,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
      ).resolves.toBeInstanceOf(Array)
    })

    it('Returns error when requerying with same phone number and no DEK', async () => {
      await expect(
        OdisUtils.Matchmaking.getContactMatches(
          E2E_TEST_PHONE_NUMBERS_RAW[0],
          CONTACT_PHONE_NUMBERS,
          E2E_TEST_ACCOUNTS[0],
          PHONE_HASH_IDENTIFIER,
          walletAuthSigner,
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
    })

    it('Returns error when requerying with different phone number and valid DEK', async () => {
      await expect(
        OdisUtils.Matchmaking.getContactMatches(
          E2E_TEST_PHONE_NUMBERS_RAW[1],
          CONTACT_PHONE_NUMBERS,
          E2E_TEST_ACCOUNTS[0],
          PHONE_HASH_IDENTIFIER,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
    })

    it('Returns success when requerying with same phone number and valid DEK after key rotation', async () => {
      // Key rotation
      const accounts = await contractKit.contracts.getAccounts()
      await accounts
        .setAccountDataEncryptionKey(ensureLeading0x(deks[1].publicKey))
        .sendAndWaitForReceipt()

      await expect(
        OdisUtils.Matchmaking.getContactMatches(
          E2E_TEST_PHONE_NUMBERS_RAW[0],
          CONTACT_PHONE_NUMBERS,
          E2E_TEST_ACCOUNTS[0],
          PHONE_HASH_IDENTIFIER,
          dekAuthSigner(1),
          SERVICE_CONTEXT
        )
      ).resolves.toBeInstanceOf(Array)
    })
  })
})
