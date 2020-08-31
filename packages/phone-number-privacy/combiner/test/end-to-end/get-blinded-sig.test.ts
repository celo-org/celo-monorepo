import { OdisUtils } from '@celo/contractkit'
import {
  AuthenticationMethod,
  ErrorMessages,
  SignMessageRequest,
} from '@celo/contractkit/lib/identity/odis/query'
import 'isomorphic-fetch'
import { replenishQuota } from '../../../common/test/utils'
import {
  ACCOUNT_ADDRESS,
  ACCOUNT_ADDRESS_NO_QUOTA,
  BLINDED_PHONE_NUMBER,
  contractKit,
  dekAuthSigner,
  PHONE_NUMBER,
  SERVICE_CONTEXT,
  walletAuthSigner,
} from './resources'

require('dotenv').config()

export const SIGN_MESSAGE_ENDPOINT = '/getBlindedMessageSig'

jest.setTimeout(15000)

describe('Running against a deployed service', () => {
  describe('Returns status ODIS_INPUT_ERROR', () => {
    it('With invalid address', async () => {
      const body: SignMessageRequest = {
        account: '0x1234',
        authenticationMethod: AuthenticationMethod.WALLET_KEY,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
        timestamp: Date.now(),
        version: 'ignore',
      }

      await expect(
        OdisUtils.Query.queryOdis(dekAuthSigner, body, SERVICE_CONTEXT, SIGN_MESSAGE_ENDPOINT)
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })

    it('With missing blindedQueryPhoneNumber', async () => {
      const body: SignMessageRequest = {
        account: ACCOUNT_ADDRESS,
        authenticationMethod: AuthenticationMethod.WALLET_KEY,
        blindedQueryPhoneNumber: '',
        timestamp: Date.now(),
        version: 'ignore',
      }
      await expect(
        OdisUtils.Query.queryOdis(walletAuthSigner, body, SERVICE_CONTEXT, SIGN_MESSAGE_ENDPOINT)
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })
  })

  describe('Returns ODIS_AUTH_ERROR', () => {
    it('With invalid authentication', async () => {
      const body: SignMessageRequest = {
        account: ACCOUNT_ADDRESS,
        authenticationMethod: AuthenticationMethod.WALLET_KEY,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
        timestamp: Date.now(),
        version: 'ignore',
      }
      await expect(
        OdisUtils.Query.queryOdis(dekAuthSigner, body, SERVICE_CONTEXT, SIGN_MESSAGE_ENDPOINT)
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })
  })

  describe('Returns ODIS_QUOTA_ERROR', () => {
    it('When querying out of quota', async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS_NO_QUOTA,
          walletAuthSigner,
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
    })
  })

  describe('With enough quota', () => {
    // if these tests are failing, it may just be that the address needs to be fauceted:
    // celotooljs account faucet --account 0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb --dollar 1 --gold 1 -e <ENV> --verbose
    const timestamp = Date.now()
    it('Returns sig when querying with unused and used request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS, contractKit)
      const body: SignMessageRequest = {
        account: ACCOUNT_ADDRESS,
        authenticationMethod: AuthenticationMethod.WALLET_KEY,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
        timestamp,
        version: 'ignore',
      }
      // Query twice to test reusing the request
      for (let i = 0; i < 2; i++) {
        await expect(
          OdisUtils.Query.queryOdis(walletAuthSigner, body, SERVICE_CONTEXT, SIGN_MESSAGE_ENDPOINT)
        ).resolves
      }
    })
  })
})
