import { StableToken } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { ErrorMessages } from '@celo/identity/lib/odis/query'
import { PnpClientQuotaStatus } from '@celo/identity/lib/odis/quota'
import {
  CombinerEndpoint,
  PnpQuotaRequest,
  PnpQuotaResponseSchema,
  SignMessageRequest,
  SignMessageResponseSchema,
} from '@celo/phone-number-privacy-common'
import { randomBytes } from 'crypto'
import 'isomorphic-fetch'
import { config as signerConfig } from '../../../signer/src/config'
import { getCombinerVersion } from '../../src'
import {
  ACCOUNT_ADDRESS,
  ACCOUNT_ADDRESS_NO_QUOTA,
  BLINDED_PHONE_NUMBER,
  dekAuthSigner,
  PHONE_NUMBER,
  SERVICE_CONTEXT,
  walletAuthSigner,
} from './resources'

require('dotenv').config()

jest.setTimeout(60000)

const expectedPhoneHash = '0x0e87c82690efb29b260d7129b9ded5ed313560997863eb5505ff7bcb5315af7a'
const expectedPepper = 'ekgnxF0UwzEii'
const expectedUnblindedSignature =
  'tbrOhZqiuMCwFOCki+ndnDpgTrkTjELvy/UDa85+VIvD3F3Fosp++6n2IDfgHdOA'

const combinerUrl = SERVICE_CONTEXT.odisUrl
const fullNodeUrl = process.env.ODIS_BLOCKCHAIN_PROVIDER

const expectedVersion = getCombinerVersion()

describe(`Running against service deployed at ${combinerUrl} w/ blockchain provider ${fullNodeUrl}`, () => {
  it('Service is deployed at correct version', async () => {
    const response = await fetch(combinerUrl + CombinerEndpoint.STATUS, {
      method: 'GET',
    })
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(body.version).toBe(expectedVersion)
  })

  describe(`${CombinerEndpoint.PNP_QUOTA}`, () => {
    it('Should succeed when authenticated with WALLET_KEY', async () => {
      const res = await OdisUtils.Quota.getPnpQuotaStatus(
        ACCOUNT_ADDRESS,
        walletAuthSigner,
        SERVICE_CONTEXT
      )
      expect(res).toStrictEqual<PnpClientQuotaStatus>({
        version: expectedVersion,
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
        version: expectedVersion,
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
        dekAuthSigner(0),
        SERVICE_CONTEXT
      )
      const expectedRes: PnpClientQuotaStatus = {
        version: expectedVersion,
        performedQueryCount: res1.performedQueryCount,
        totalQuota: res1.totalQuota,
        remainingQuota: res1.totalQuota - res1.performedQueryCount,
        blockNumber: res1.blockNumber,
        warnings: [],
      }
      expect(res1).toStrictEqual<PnpClientQuotaStatus>(expectedRes)
      const res2 = await OdisUtils.Quota.getPnpQuotaStatus(
        ACCOUNT_ADDRESS,
        dekAuthSigner(0),
        SERVICE_CONTEXT
      )
      expectedRes.blockNumber = res2.blockNumber
      expect(res2).toStrictEqual<PnpClientQuotaStatus>(expectedRes)
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_INPUT_ERROR} with invalid address`, async () => {
      await expect(
        OdisUtils.Quota.getPnpQuotaStatus('not an address', dekAuthSigner(0), SERVICE_CONTEXT)
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_AUTH_ERROR} with invalid WALLET_KEY auth`, async () => {
      const req: PnpQuotaRequest = {
        account: ACCOUNT_ADDRESS,
        authenticationMethod: walletAuthSigner.authenticationMethod,
      }
      await expect(
        OdisUtils.Query.queryOdis(
          req,
          SERVICE_CONTEXT,
          CombinerEndpoint.PNP_QUOTA,
          PnpQuotaResponseSchema,
          {
            Authorization: await walletAuthSigner.contractKit.connection.sign(
              JSON.stringify(req),
              ACCOUNT_ADDRESS_NO_QUOTA
            ),
          }
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_AUTH_ERROR} with invalid DEK auth`, async () => {
      await expect(
        OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          dekAuthSigner(1), // DEK auth signer doesn't match the registered DEK for ACCOUNT_ADDRESS
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })
  })

  describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
    describe('new requests', () => {
      beforeAll(async () => {
        // Replenish quota for ACCOUNT_ADDRESS
        // If this fails, may be necessary to faucet ACCOUNT_ADDRESS more funds
        const numQueriesToReplenish = 2
        const amountInWei = signerConfig.quota.queryPriceInCUSD
          .times(1e18)
          .times(numQueriesToReplenish)
          .toString()
        const stableToken = await walletAuthSigner.contractKit.contracts.getStableToken(
          StableToken.cUSD
        )
        const odisPayments = await walletAuthSigner.contractKit.contracts.getOdisPayments()
        await stableToken
          .approve(odisPayments.address, amountInWei)
          .sendAndWaitForReceipt({ from: ACCOUNT_ADDRESS })
        await odisPayments
          .payInCUSD(ACCOUNT_ADDRESS, amountInWei)
          .sendAndWaitForReceipt({ from: ACCOUNT_ADDRESS })
      })

      // Requests made for PHONE_NUMBER from ACCOUNT_ADDRESS & same blinding factor
      // are replayed from previous test runs (for every run after the very first)
      let startingPerformedQueryCount: number
      let startingTotalQuota: number
      beforeEach(async () => {
        const res = await OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
        startingPerformedQueryCount = res.performedQueryCount
        startingTotalQuota = res.totalQuota
      })

      it('Should increment performedQueryCount on success with DEK auth', async () => {
        // Raw key is used as the blinding client's seed, so we need a new PN
        // Create a fake PN that is always incrementing and shouldn't ever repeat
        const unusedPN = `+1${Date.now()}`
        await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          unusedPN,
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
        const quotaRes = await OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
        expect(quotaRes).toStrictEqual<PnpClientQuotaStatus>({
          version: expectedVersion,
          performedQueryCount: startingPerformedQueryCount + 1,
          totalQuota: startingTotalQuota,
          remainingQuota: startingTotalQuota - (startingPerformedQueryCount + 1),
          blockNumber: quotaRes.blockNumber,
          warnings: [],
        })
      })

      it('Should increment performedQueryCount on success with WALLET_KEY auth', async () => {
        await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          walletAuthSigner,
          SERVICE_CONTEXT,
          Buffer.from(randomBytes(32)).toString('base64')
        )
        const quotaRes = await OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          walletAuthSigner,
          SERVICE_CONTEXT
        )
        expect(quotaRes).toStrictEqual<PnpClientQuotaStatus>({
          version: expectedVersion,
          performedQueryCount: startingPerformedQueryCount + 1,
          totalQuota: startingTotalQuota,
          remainingQuota: startingTotalQuota - (startingPerformedQueryCount + 1),
          blockNumber: quotaRes.blockNumber,
          warnings: [],
        })
      })
    })

    describe('replayed requests', () => {
      const replayedBlindingFactor = Buffer.from('test string for blinding factor').toString(
        'base64'
      )
      beforeAll(async () => {
        // Ensure that these are each called at least once for the first test runs
        await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          walletAuthSigner,
          SERVICE_CONTEXT,
          replayedBlindingFactor
        )
        await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
      })

      // Requests made for PHONE_NUMBER from ACCOUNT_ADDRESS
      // are replayed from previous test runs (for every run after the very first)
      let startingPerformedQueryCount: number
      let startingTotalQuota: number
      beforeEach(async () => {
        const res = await OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
        startingPerformedQueryCount = res.performedQueryCount
        startingTotalQuota = res.totalQuota
      })

      it('Should succeed and not update performedQueryCount when authenticated with WALLET_KEY', async () => {
        const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          walletAuthSigner,
          SERVICE_CONTEXT,
          replayedBlindingFactor
        )
        expect(res).toStrictEqual<PhoneNumberHashDetails>({
          e164Number: PHONE_NUMBER,
          phoneHash: expectedPhoneHash,
          pepper: expectedPepper,
          unblindedSignature: expectedUnblindedSignature,
        })
        const quotaRes = await OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          walletAuthSigner,
          SERVICE_CONTEXT
        )
        expect(quotaRes.performedQueryCount).toEqual(startingPerformedQueryCount)
        expect(quotaRes.totalQuota).toEqual(startingTotalQuota)
      })

      it('Should succeed and not update performedQueryCount when authenticated with DEK', async () => {
        const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
        expect(res).toStrictEqual<PhoneNumberHashDetails>({
          e164Number: PHONE_NUMBER,
          phoneHash: expectedPhoneHash,
          pepper: expectedPepper,
          unblindedSignature: expectedUnblindedSignature,
        })
        const quotaRes = await OdisUtils.Quota.getPnpQuotaStatus(
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
        expect(quotaRes.performedQueryCount).toEqual(startingPerformedQueryCount)
        expect(quotaRes.totalQuota).toEqual(startingTotalQuota)
      })
    })

    // NOTE: these are also replayed requests
    for (let i = 1; i <= 2; i++) {
      it(`Should succeed on valid request with key version header ${i}`, async () => {
        const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          i
        )
        expect(res).toStrictEqual<PhoneNumberHashDetails>({
          e164Number: PHONE_NUMBER,
          phoneHash: expectedPhoneHash,
          pepper: expectedPepper,
          unblindedSignature: expectedUnblindedSignature,
        })
      })
    }

    it(`Should succeed on invalid key version`, async () => {
      const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
        PHONE_NUMBER,
        ACCOUNT_ADDRESS,
        dekAuthSigner(0),
        SERVICE_CONTEXT,
        undefined,
        undefined,
        undefined,
        undefined,
        1.5
      )
      expect(res).toStrictEqual<PhoneNumberHashDetails>({
        e164Number: PHONE_NUMBER,
        phoneHash: expectedPhoneHash,
        pepper: expectedPepper,
        unblindedSignature: expectedUnblindedSignature,
      })
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_INPUT_ERROR} on unsupported key version`, async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          10
        )
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_INPUT_ERROR} on invalid address`, async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          'not an address',
          dekAuthSigner(0),
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          1
        )
      ).rejects.toThrow(ErrorMessages.ODIS_INPUT_ERROR)
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_INPUT_ERROR} on invalid phone number`, async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          'not a phone number',
          ACCOUNT_ADDRESS,
          dekAuthSigner(0),
          SERVICE_CONTEXT,
          undefined,
          undefined,
          undefined,
          undefined,
          1
        )
      ).rejects.toThrow('Invalid phone number: not a phone number')
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_AUTH_ERROR} with invalid WALLET_KEY auth`, async () => {
      const req: SignMessageRequest = {
        account: ACCOUNT_ADDRESS,
        blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
        authenticationMethod: walletAuthSigner.authenticationMethod,
      }
      await expect(
        OdisUtils.Query.queryOdis(
          req,
          SERVICE_CONTEXT,
          CombinerEndpoint.PNP_SIGN,
          SignMessageResponseSchema,
          {
            Authorization: await walletAuthSigner.contractKit.connection.sign(
              JSON.stringify(req),
              ACCOUNT_ADDRESS_NO_QUOTA
            ),
          }
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_AUTH_ERROR} with invalid DEK auth`, async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS,
          dekAuthSigner(1), // DEK auth signer doesn't match the registered DEK for ACCOUNT_ADDRESS
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })

    it(`Should reject to throw ${ErrorMessages.ODIS_QUOTA_ERROR} when account has no quota`, async () => {
      await expect(
        OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          PHONE_NUMBER,
          ACCOUNT_ADDRESS_NO_QUOTA,
          dekAuthSigner(0),
          SERVICE_CONTEXT
        )
      ).rejects.toThrow(ErrorMessages.ODIS_QUOTA_ERROR)
    })
  })
})
