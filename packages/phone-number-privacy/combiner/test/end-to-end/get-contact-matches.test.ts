import { OdisUtils } from '@celo/identity/lib/odis'
import { ErrorMessages } from '@celo/identity/lib/odis/query'
import 'isomorphic-fetch'
import { E2E_TEST_PHONE_HASH_IDENTIFIER, E2E_TEST_PHONE_NUMBER } from '../../src/config'
import {
  ACCOUNT_ADDRESS,
  CONTACT_PHONE_NUMBERS,
  dekAuthSigner,
  PHONE_HASH_IDENTIFIER,
  PHONE_NUMBER,
  PHONE_NUMBER_2,
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
    const badDEKSigner = dekAuthSigner
    badDEKSigner.rawKey = 'fake'
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        PHONE_HASH_IDENTIFIER,
        badDEKSigner,
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
    const badDEKSigner = dekAuthSigner
    badDEKSigner.rawKey = 'fake'
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT,
        badDEKSigner
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })

  it('Returns error when querying fails with a replayed request missing signedUserPhoneNumber', async () => {
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

  it.only('Returns success when requerying matches with same phone number', async () => {
    // const accounts = await contractKit.contracts.getAccounts()
    // await accounts.setAccountDataEncryptionKey(ensureLeading0x(deks[0].publicKey)).sendAndWaitForReceipt()

    // const identifier = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(PHONE_NUMBER, ACCOUNT_ADDRESS, walletAuthSigner, SERVICE_CONTEXT)
    // const attestationsWrapper: AttestationsWrapper = await contractKit.contracts.getAttestations()
    // expect(await attestationsWrapper.getVerifiedStatus(identifier.phoneHash, ACCOUNT_ADDRESS)).resolves.toBeTruthy()
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        E2E_TEST_PHONE_NUMBER,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        E2E_TEST_PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT,
        dekAuthSigner
      )
    ).resolves.toBeInstanceOf(Array)
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

  it('Returns error when requerying matches with different phone number', async () => {
    await expect(
      OdisUtils.Matchmaking.getContactMatches(
        PHONE_NUMBER_2,
        CONTACT_PHONE_NUMBERS,
        ACCOUNT_ADDRESS,
        PHONE_HASH_IDENTIFIER,
        walletAuthSigner,
        SERVICE_CONTEXT,
        dekAuthSigner
      )
    ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  })
})
