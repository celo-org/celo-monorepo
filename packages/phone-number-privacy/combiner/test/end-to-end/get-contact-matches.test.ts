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
        dekAuthSigner
      )
    ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
  })

  it('Returns error when querying fails with an unauthenticated request', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        PHONE_HASH_IDENTIFIER,
        { ...dekAuthSigner, rawKey: 'fake' },
        SERVICE_CONTEXT
      )
    ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
  })

  it('Returns error when querying fails with an unverified account', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT,
        dekAuthSigner
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Returns error when querying fails with an invalid signedUserPhoneNumber', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        E2E_TEST_PHONE_NUMBERS_RAW[0],
        CONTACT_PHONE_NUMBERS,
        E2E_TEST_ACCOUNTS[0],
        PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT,
        { ...dekAuthSigner, rawKey: 'fake' }
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Returns error when requerying fails without signedUserPhoneNumber', async () => {
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

  it('Returns success when requerying with same phone number', async () => {
    const accounts = await contractKit.contracts.getAccounts()
    await accounts
      .setAccountDataEncryptionKey(ensureLeading0x(deks[0].publicKey))
      .sendAndWaitForReceipt()

    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        E2E_TEST_PHONE_NUMBERS_RAW[0],
        CONTACT_PHONE_NUMBERS,
        E2E_TEST_ACCOUNTS[0],
        PHONE_HASH_IDENTIFIER,
        dekAuthSigner,
        SERVICE_CONTEXT
      )
    ).resolves.toBeInstanceOf(Array)
  })

  // TODO fix these 2 tests
  it.skip('Returns error when requerying matches with different phone number', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        E2E_TEST_PHONE_NUMBERS_RAW[1],
        CONTACT_PHONE_NUMBERS,
        E2E_TEST_ACCOUNTS[0],
        PHONE_HASH_IDENTIFIER,
        dekAuthSigner,
        SERVICE_CONTEXT
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it.skip('Returns success when requerying matches with same phone number after key rotation', async () => {
    // const accounts = await this.kit.contracts.getAccounts()
    // await displaySendTx(
    //   'RegisterDataEncryptionKey',
    //   accounts.setAccountDataEncryptionKey(ensureLeading0x(publicKey))
    // )
    // TODO
    // await expect(
    //   OdisUtils.Matchmaking.getContactMatches(
    //     PHONE_NUMBER,
    //     CONTACT_PHONE_NUMBERS,
    //     ACCOUNT_ADDRESS,
    //     PHONE_HASH_IDENTIFIER,
    //     dekAuthSigner,
    //     SERVICE_CONTEXT
    //   )
    // ).resolves.toBeInstanceOf(Response)
  })
})
