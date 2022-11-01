import { newKit } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity-prev'
import { SignMessageRequest, WalletKeySigner } from '@celo/identity-prev/lib/odis/query'
import { ErrorMessages } from '@celo/identity/lib/odis/query'
import { AuthenticationMethod, Endpoint } from '@celo/phone-number-privacy-common'
import { replenishQuota } from '@celo/phone-number-privacy-common/lib/test/utils'
import { genSessionID } from '@celo/phone-number-privacy-common/lib/utils/logger'
import 'isomorphic-fetch'
import {
  ACCOUNT_ADDRESS,
  ACCOUNT_ADDRESS_NO_QUOTA,
  BLINDED_PHONE_NUMBER,
  DEFAULT_FORNO_URL,
  dekAuthSigner,
  PHONE_NUMBER,
  SERVICE_CONTEXT,
} from './resources'

require('dotenv').config()

jest.setTimeout(60000)

const contractKit = newKit(DEFAULT_FORNO_URL)

const walletAuthSigner: WalletKeySigner = {
  authenticationMethod: AuthenticationMethod.WALLET_KEY,
  contractKit,
}

const combinerUrl = process.env.ODIS_COMBINER_SERVICE_URL
const fullNodeUrl = process.env.ODIS_BLOCKCHAIN_PROVIDER

describe(`Running against service deployed at ${combinerUrl} w/ blockchain provider ${fullNodeUrl}`, () => {
  describe('Returns status ODIS_INPUT_ERROR', () => {
    it('With invalid address', async () => {
      const body: SignMessageRequest = {
        account: '0x1234',
        authenticationMethod: AuthenticationMethod.WALLET_KEY,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
        version: 'ignore',
        sessionID: genSessionID(),
      }

      await expect(
        OdisUtils.Query.queryOdis(dekAuthSigner(0), body, SERVICE_CONTEXT, Endpoint.LEGACY_PNP_SIGN)
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })

    it('With missing blindedQueryPhoneNumber', async () => {
      const body: SignMessageRequest = {
        account: ACCOUNT_ADDRESS,
        authenticationMethod: AuthenticationMethod.WALLET_KEY,
        blindedQueryPhoneNumber: '',
        version: 'ignore',
        sessionID: genSessionID(),
      }
      await expect(
        OdisUtils.Query.queryOdis(walletAuthSigner, body, SERVICE_CONTEXT, Endpoint.LEGACY_PNP_SIGN)
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })
  })

  describe('Returns ODIS_AUTH_ERROR', () => {
    it('With invalid authentication', async () => {
      const body: SignMessageRequest = {
        account: ACCOUNT_ADDRESS,
        authenticationMethod: AuthenticationMethod.WALLET_KEY,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
        version: 'ignore',
      }
      await expect(
        OdisUtils.Query.queryOdis(dekAuthSigner(0), body, SERVICE_CONTEXT, Endpoint.LEGACY_PNP_SIGN)
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
    it('Returns sig when querying with unused and used request', async () => {
      await replenishQuota(ACCOUNT_ADDRESS, contractKit)
      const body: SignMessageRequest = {
        account: ACCOUNT_ADDRESS,
        authenticationMethod: AuthenticationMethod.WALLET_KEY,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
        version: 'ignore',
        sessionID: genSessionID(),
      }
      // Query twice to test reusing the request
      for (let i = 0; i < 2; i++) {
        const result = OdisUtils.Query.queryOdis(
          walletAuthSigner,
          body,
          SERVICE_CONTEXT,
          Endpoint.LEGACY_PNP_SIGN
        )
        await expect(result).resolves.toMatchObject({ success: true })
      }
    })
  })
})
