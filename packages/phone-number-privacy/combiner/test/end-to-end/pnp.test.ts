import { OdisUtils } from '@celo/identity'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { ErrorMessages } from '@celo/identity/lib/odis/query'
import { PnpClientQuotaStatus } from '@celo/identity/lib/odis/quota'
import { CombinerEndpoint } from '@celo/phone-number-privacy-common'
import 'isomorphic-fetch'
import { VERSION } from '../../src/config'
import {
  ACCOUNT_ADDRESS,
  ACCOUNT_ADDRESS_NO_QUOTA,
  dekAuthSigner,
  PHONE_NUMBER,
  SERVICE_CONTEXT,
  walletAuthSigner,
} from './resources'

require('dotenv').config()

jest.setTimeout(60000)

const combinerUrl = process.env.ODIS_COMBINER_SERVICE_URL
const fullNodeUrl = process.env.ODIS_BLOCKCHAIN_PROVIDER

describe(`Running against service deployed at ${combinerUrl} w/ blockchain provider ${fullNodeUrl}`, () => {
  it('Service is deployed at correct version', async () => {
    const response = await fetch(combinerUrl + CombinerEndpoint.STATUS, {
      method: 'GET',
    })
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(body.version).toBe(VERSION)
  })

  describe(`${CombinerEndpoint.PNP_QUOTA}`, () => {
    it('Should succeed when authenticated with WALLET_KEY', async () => {
      const res = await OdisUtils.Quota.getPnpQuotaStatus(
        ACCOUNT_ADDRESS,
        walletAuthSigner,
        SERVICE_CONTEXT
      )
      expect(res).toStrictEqual<PnpClientQuotaStatus>({
        version: VERSION,
        performedQueryCount: res.performedQueryCount,
        totalQuota: res.totalQuota,
        remainingQuota: res.totalQuota - res.performedQueryCount,
        blockNumber: res.blockNumber,
        warnings: [],
      })
    })

    it('Should succeed when authenticated with DEK', async () => {
      const res = await OdisUtils.Quota.getPnpQuotaStatus(
        ACCOUNT_ADDRESS,
        dekAuthSigner(0),
        SERVICE_CONTEXT
      )
      expect(res).toStrictEqual<PnpClientQuotaStatus>({
        version: VERSION,
        performedQueryCount: res.performedQueryCount,
        totalQuota: res.totalQuota,
        remainingQuota: res.totalQuota - res.performedQueryCount,
        blockNumber: res.blockNumber,
        warnings: [],
      })
    })

    it('Should succeed on repeated valid requests', async () => {
      const res1 = await OdisUtils.Quota.getPnpQuotaStatus(
        ACCOUNT_ADDRESS,
        walletAuthSigner,
        SERVICE_CONTEXT
      )
      expect(res1).toStrictEqual<PnpClientQuotaStatus>({
        version: VERSION,
        performedQueryCount: res1.performedQueryCount,
        totalQuota: res1.totalQuota,
        remainingQuota: res1.totalQuota - res1.performedQueryCount,
        blockNumber: res1.blockNumber,
        warnings: [],
      })
      const res2 = await OdisUtils.Quota.getPnpQuotaStatus(
        ACCOUNT_ADDRESS,
        dekAuthSigner(0),
        SERVICE_CONTEXT
      )
      expect(res2).toStrictEqual<PnpClientQuotaStatus>(res1)
    })

    // TODO(Alec) is this test missing for describe block below for sign endpoint?
    it(`Should reject to throw ${ErrorMessages.ODIS_INPUT_ERROR} with invalid address`, async () => {
      await expect(
        OdisUtils.Quota.getPnpQuotaStatus('not an address', walletAuthSigner, SERVICE_CONTEXT)
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })

    // TODO(2.0.0, deployment)
    xit(`Should reject to throw ${ErrorMessages.ODIS_AUTH_ERROR} with invalid WALLET_KEY auth`, async () => {
      await expect(
        OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          walletAuthSigner, // TODO we need to create a bad auth signer to replace this with
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })

    // TODO(2.0.0, deployment)
    xit(`Should reject to throw ${ErrorMessages.ODIS_AUTH_ERROR} with invalid DEK auth`, async () => {
      await expect(
        OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          dekAuthSigner(0), // TODO we need to create a bad auth signer to replace this with
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })
  })

  describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
    it('Should succeed when authenticated with WALLET_KEY', async () => {
      const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
        PHONE_NUMBER,
        ACCOUNT_ADDRESS,
        walletAuthSigner,
        SERVICE_CONTEXT,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        CombinerEndpoint.PNP_SIGN
      )
      expect(res).toStrictEqual<PhoneNumberHashDetails>({
        e164Number: 'TODO',
        phoneHash: 'TODO',
        pepper: 'TODO',
      })
    })

    it('Should succeed when authenticated with DEK', async () => {
      const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
        PHONE_NUMBER,
        ACCOUNT_ADDRESS,
        dekAuthSigner(0),
        SERVICE_CONTEXT,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        CombinerEndpoint.PNP_SIGN
      )
      expect(res).toStrictEqual<PhoneNumberHashDetails>({
        e164Number: 'TODO',
        phoneHash: 'TODO',
        pepper: 'TODO',
      })
    })

    it('Should succeed on repeated valid requests', async () => {
      const res1 = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
        PHONE_NUMBER,
        ACCOUNT_ADDRESS,
        walletAuthSigner,
        SERVICE_CONTEXT,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        CombinerEndpoint.PNP_SIGN
      )
      expect(res1).toStrictEqual<PhoneNumberHashDetails>({
        e164Number: 'TODO',
        phoneHash: 'TODO',
        pepper: 'TODO',
      })
      const res2 = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
        PHONE_NUMBER,
        ACCOUNT_ADDRESS,
        dekAuthSigner(0),
        SERVICE_CONTEXT,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        CombinerEndpoint.PNP_SIGN
      )
      expect(res2).toStrictEqual<PhoneNumberHashDetails>(res1)
    })

    for (let i = 1; i <= 2; i++) {
      it(`Should succeed on valid request with key version header ${i}`, async () => {
        const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          walletAuthSigner,
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          i,
          CombinerEndpoint.PNP_SIGN
        )
        expect(res).toStrictEqual<PhoneNumberHashDetails>({
          e164Number: 'TODO',
          phoneHash: 'TODO',
          pepper: 'TODO',
        })
      })
    }

    it(`Should reject to throw ${ErrorMessages.ODIS_INPUT_ERROR} on unsupported key version`, async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          walletAuthSigner,
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          3,
          CombinerEndpoint.PNP_SIGN
        )
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })

    it('Should increment performedQueryCount on success', async () => {
      const res1 = await OdisUtils.Quota.getPnpQuotaStatus(
        ACCOUNT_ADDRESS,
        walletAuthSigner,
        SERVICE_CONTEXT
      )
      await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
        PHONE_NUMBER,
        ACCOUNT_ADDRESS,
        walletAuthSigner,
        SERVICE_CONTEXT,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        CombinerEndpoint.PNP_SIGN
      )
      const res2 = await OdisUtils.Quota.getPnpQuotaStatus(
        ACCOUNT_ADDRESS,
        walletAuthSigner,
        SERVICE_CONTEXT
      )
      expect(res2).toStrictEqual<PnpClientQuotaStatus>({
        version: VERSION,
        performedQueryCount: res1.performedQueryCount + 1,
        totalQuota: res1.totalQuota,
        remainingQuota: res1.totalQuota - res1.performedQueryCount + 1,
        blockNumber: res2.blockNumber,
        warnings: [],
      })
    })

    // TODO(2.0.0, deployment)
    xit(`Should reject to throw ${ErrorMessages.ODIS_AUTH_ERROR} with invalid WALLET_KEY auth`, async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          walletAuthSigner, // TODO we need to create a bad auth signer to replace this with
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          CombinerEndpoint.PNP_SIGN
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })

    // TODO(2.0.0, deployment)
    xit(`Should reject to throw ${ErrorMessages.ODIS_AUTH_ERROR} with invalid DEK auth`, async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          dekAuthSigner(0), // TODO we need to create a bad auth signer to replace this with
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          CombinerEndpoint.PNP_SIGN
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_QUOTA_ERROR} when account has no quota`, async () => {
      await expect(
        await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS_NO_QUOTA,
          walletAuthSigner,
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          CombinerEndpoint.PNP_SIGN
        )
      ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
    })
  })

  // describe('Returns status ODIS_INPUT_ERROR', () => {
  //   it('With invalid address', async () => {
  //     const body: SignMessageRequest = {
  //       account: '0x1234',
  //       authenticationMethod: AuthenticationMethod.WALLET_KEY,
  //       blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
  //       version: 'ignore',
  //       sessionID: genSessionID(),
  //     }

  //     await expect(
  //       OdisUtils.Query.queryOdis(dekAuthSigner(0), body, SERVICE_CONTEXT, Endpoint.LEGACY_PNP_SIGN)
  //     ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
  //   })

  //   it('With missing blindedQueryPhoneNumber', async () => {
  //     const body: SignMessageRequest = {
  //       account: ACCOUNT_ADDRESS,
  //       authenticationMethod: AuthenticationMethod.WALLET_KEY,
  //       blindedQueryPhoneNumber: '',
  //       version: 'ignore',
  //       sessionID: genSessionID(),
  //     }
  //     await expect(
  //       OdisUtils.Query.queryOdis(walletAuthSigner, body, SERVICE_CONTEXT, Endpoint.LEGACY_PNP_SIGN)
  //     ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
  //   })
  // })

  // describe('Returns ODIS_AUTH_ERROR', () => {
  //   it('With invalid authentication', async () => {
  //     const body: SignMessageRequest = {
  //       account: ACCOUNT_ADDRESS,
  //       authenticationMethod: AuthenticationMethod.WALLET_KEY,
  //       blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
  //       version: 'ignore',
  //     }
  //     await expect(
  //       OdisUtils.Query.queryOdis(dekAuthSigner(0), body, SERVICE_CONTEXT, Endpoint.LEGACY_PNP_SIGN)
  //     ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
  //   })
  // })

  // describe('Returns ODIS_QUOTA_ERROR', () => {
  //   it('When querying out of quota', async () => {
  //     await expect(
  //       OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
  //         PHONE_NUMBER,
  //         ACCOUNT_ADDRESS_NO_QUOTA,
  //         walletAuthSigner,
  //         SERVICE_CONTEXT
  //       )
  //     ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
  //   })
  // })

  // describe('With enough quota', () => {
  //   // if these tests are failing, it may just be that the address needs to be fauceted:
  //   // celotooljs account faucet --account 0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb --dollar 1 --gold 1 -e <ENV> --verbose
  //   it('Returns sig when querying with unused and used request', async () => {
  //     await replenishQuota(ACCOUNT_ADDRESS, contractKit)
  //     const body: SignMessageRequest = {
  //       account: ACCOUNT_ADDRESS,
  //       authenticationMethod: AuthenticationMethod.WALLET_KEY,
  //       blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
  //       version: 'ignore',
  //       sessionID: genSessionID(),
  //     }
  //     // Query twice to test reusing the request
  //     for (let i = 0; i < 2; i++) {
  //       const result = OdisUtils.Query.queryOdis(
  //         walletAuthSigner,
  //         body,
  //         SERVICE_CONTEXT,
  //         Endpoint.LEGACY_PNP_SIGN
  //       )
  //       await expect(result).resolves.toMatchObject({ success: true })
  //     }
  //   })
  // })
})
