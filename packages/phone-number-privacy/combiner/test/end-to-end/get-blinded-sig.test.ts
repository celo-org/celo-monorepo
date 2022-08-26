import { OdisUtils } from '@celo/identity/lib/odis'
// TODO(2.0.0, imports) revisit these imports from the identity package (vs. directly from common)
import {
  AuthenticationMethod,
  ErrorMessages,
  SignMessageRequest,
} from '@celo/identity/lib/odis/query'
import { Endpoints } from '@celo/phone-number-privacy-common'
import { genSessionID } from '@celo/phone-number-privacy-common/lib/utils/logger'
import 'isomorphic-fetch'
import { replenishQuota } from '../../../common/src/test/utils'
import { VERSION } from '../../src/config'
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

jest.setTimeout(60000)

describe('Running against a deployed service', () => {
  beforeAll(() => {
    console.log('ODIS_COMBINER_SERVICE_URL: ' + process.env.ODIS_COMBINER_SERVICE_URL)
    console.log('ODIS_BLOCKCHAIN_PROVIDER: ' + process.env.ODIS_BLOCKCHAIN_PROVIDER)
  })

  // This test is disabled because the Combiner status endpoint doesn't work
  xit('Service is deployed at correct version', async () => {
    const response = await fetch(process.env.ODIS_COMBINER_SERVICE_URL + Endpoints.STATUS, {
      method: 'GET',
    })
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(body.version).toBe(VERSION)
  })

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
        OdisUtils.Query.queryOdis(dekAuthSigner(0), body, SERVICE_CONTEXT, SIGN_MESSAGE_ENDPOINT)
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
        version: 'ignore',
      }
      await expect(
        OdisUtils.Query.queryOdis(dekAuthSigner(0), body, SERVICE_CONTEXT, SIGN_MESSAGE_ENDPOINT)
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
          SIGN_MESSAGE_ENDPOINT
        )
        await expect(result).resolves.toMatchObject({ success: true })
      }
    })
  })
})
