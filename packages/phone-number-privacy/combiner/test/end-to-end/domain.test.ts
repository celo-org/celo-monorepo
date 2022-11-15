import {
  BackupErrorTypes,
  buildOdisDomain,
  E2E_TESTING_ALFAJORES_CONFIG,
  NO_QUOTA_ALFAJORES_CONFIG,
  odisHardenKey,
  odisQueryAuthorizer,
  requestOdisDomainQuotaStatus,
} from '@celo/encrypted-backup'
import { OdisUtils } from '@celo/identity'
import { ErrorMessages } from '@celo/identity/lib/odis/query'
import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestEIP712,
  disableDomainResponseSchema,
  DisableDomainResponseSuccess,
  domainHash,
  DomainQuotaStatusResponseSuccess,
  DomainRequestTypeTag,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  domainRestrictedSignatureResponseSchema,
  DomainRestrictedSignatureResponseSuccess,
  genSessionID,
  KEY_VERSION_HEADER,
  PoprfClient,
  SequentialDelayDomain,
  SequentialDelayDomainStateSchema,
  TestUtils,
} from '@celo/phone-number-privacy-common'
import { defined, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import * as crypto from 'crypto'
import 'isomorphic-fetch'
import { getCombinerVersion } from '../../src'
import { SERVICE_CONTEXT } from './resources'

require('dotenv').config()

jest.setTimeout(60000)

const combinerUrl = SERVICE_CONTEXT.odisUrl
const fullNodeUrl = process.env.ODIS_BLOCKCHAIN_PROVIDER

const authorizer = odisQueryAuthorizer(Buffer.from('combiner e2e authorizer test seed'))

const domain = buildOdisDomain(E2E_TESTING_ALFAJORES_CONFIG.odis!, authorizer.address)

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

  describe(`${CombinerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    const testThatValidRequestSucceeds = async () => {
      const res = await requestOdisDomainQuotaStatus(
        domain,
        SERVICE_CONTEXT,
        genSessionID(),
        authorizer.wallet
      )

      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
          success: true,
          version: expectedVersion,
          status: {
            timer: res.result.status.timer,
            counter: res.result.status.counter,
            now: res.result.status.now,
            disabled: false,
          },
        })
      }
    }

    it('Should succeed on valid request', async () => {
      await testThatValidRequestSucceeds()
    })

    it('Should succeed on repeated valid requests', async () => {
      await testThatValidRequestSucceeds()
      await testThatValidRequestSucceeds()
    })
  })

  describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
    const testThatValidRequestSucceeds = async () => {
      const expectedResult = 'olxWliQnGKtj2RcwmZUw7z8Fo9qpTWeom712GdvWAJ8='
      const res = await odisHardenKey(
        Buffer.from('password'),
        domain,
        SERVICE_CONTEXT,
        authorizer.wallet
      )
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.result.toString('base64')).toEqual(expectedResult)
      }
    }

    it('Should succeed on valid request', async () => {
      await testThatValidRequestSucceeds()
    })

    it('Should succeed on repeated valid request', async () => {
      await testThatValidRequestSucceeds()
      await testThatValidRequestSucceeds()
    })

    const signatureRequest = async (
      keyVersion: number,
      nonce: number,
      _domain: SequentialDelayDomain = domain
    ): Promise<[DomainRestrictedSignatureRequest<SequentialDelayDomain>, PoprfClient]> => {
      const poprfClient = new PoprfClient(
        Buffer.from(TestUtils.Values.DOMAINS_THRESHOLD_DEV_PUBKEYS[keyVersion - 1], 'base64'),
        domainHash(_domain),
        Buffer.from('test message', 'utf8')
      )

      const req: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
        type: DomainRequestTypeTag.SIGN,
        domain: _domain,
        options: {
          signature: noString,
          nonce: defined(nonce),
        },
        blindedMessage: poprfClient.blindedMessage.toString('base64'),
        sessionID: defined(genSessionID()),
      }
      req.options.signature = defined(
        await authorizer.wallet.signTypedData(
          authorizer.address,
          domainRestrictedSignatureRequestEIP712(req)
        )
      )
      return [req, poprfClient]
    }

    for (let i = 1; i <= 2; i++) {
      it(`Should succeed on valid request with key version header ${i}`, async () => {
        const quotaRes = await requestOdisDomainQuotaStatus(
          domain,
          SERVICE_CONTEXT,
          genSessionID(),
          authorizer.wallet
        )

        let nonce = 0

        expect(quotaRes.ok).toBe(true)
        if (quotaRes.ok) {
          expect(quotaRes.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
            success: true,
            version: expectedVersion,
            status: {
              timer: quotaRes.result.status.timer,
              counter: quotaRes.result.status.counter,
              now: quotaRes.result.status.now,
              disabled: false,
            },
          })
          nonce = quotaRes.result.status.counter
        }

        const keyVersion = 1
        const [req, _] = await signatureRequest(keyVersion, nonce)
        const res = await OdisUtils.Query.sendOdisDomainRequest(
          req,
          SERVICE_CONTEXT,
          CombinerEndpoint.DOMAIN_SIGN,
          domainRestrictedSignatureResponseSchema(SequentialDelayDomainStateSchema),
          {
            [KEY_VERSION_HEADER]: keyVersion.toString(),
          }
        )

        expect(res.success).toBe(true)
        if (res.success) {
          expect(res).toStrictEqual<DomainRestrictedSignatureResponseSuccess>({
            success: true,
            version: expectedVersion,
            signature: res.signature,
            status: {
              timer: res.status.timer,
              counter: res.status.counter,
              now: res.status.now,
              disabled: false,
            },
          })
        }
      })
    }

    it('Should throw on invalid authentication', async () => {
      const quotaRes = await requestOdisDomainQuotaStatus(
        domain,
        SERVICE_CONTEXT,
        genSessionID(),
        authorizer.wallet
      )

      let nonce = 0

      expect(quotaRes.ok).toBe(true)
      if (quotaRes.ok) {
        expect(quotaRes.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
          success: true,
          version: expectedVersion,
          status: {
            timer: quotaRes.result.status.timer,
            counter: quotaRes.result.status.counter,
            now: quotaRes.result.status.now,
            disabled: false,
          },
        })
        nonce = quotaRes.result.status.counter
      }

      const keyVersion = 1
      const [req, _] = await signatureRequest(keyVersion, nonce)

      req.domain.salt = defined('badSalt')

      await expect(
        OdisUtils.Query.sendOdisDomainRequest(
          req,
          SERVICE_CONTEXT,
          CombinerEndpoint.DOMAIN_SIGN,
          domainRestrictedSignatureResponseSchema(SequentialDelayDomainStateSchema),
          {
            [KEY_VERSION_HEADER]: keyVersion.toString(),
          }
        )
      ).rejects.toThrow(ErrorMessages.ODIS_AUTH_ERROR)
    })

    it('Should return error on out of quota', async () => {
      const noQuotaDomain = buildOdisDomain(NO_QUOTA_ALFAJORES_CONFIG.odis!, authorizer.address)
      const res = await odisHardenKey(
        Buffer.from('password'),
        noQuotaDomain,
        SERVICE_CONTEXT,
        authorizer.wallet
      )
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.errorType).toEqual(BackupErrorTypes.ODIS_RATE_LIMITING_ERROR)
      }
    })
  })

  describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
    const domainForDisabling = buildOdisDomain(
      E2E_TESTING_ALFAJORES_CONFIG.odis!,
      authorizer.address,
      'e2e testing, okay to disable ' + crypto.randomBytes(16).toString('base64')
    )
    const disableRequest = async (): Promise<DisableDomainRequest<SequentialDelayDomain>> => {
      const req: DisableDomainRequest<SequentialDelayDomain> = {
        type: DomainRequestTypeTag.DISABLE,
        domain: domainForDisabling,
        options: {
          signature: noString,
          nonce: noNumber,
        },
        sessionID: defined(genSessionID()),
      }
      req.options.signature = defined(
        await authorizer.wallet.signTypedData(authorizer.address, disableDomainRequestEIP712(req))
      )
      return req
    }

    const testThatDomainIsNotAlreadyDisabled = async () => {
      const quotaRes = await requestOdisDomainQuotaStatus(
        domainForDisabling,
        SERVICE_CONTEXT,
        genSessionID(),
        authorizer.wallet
      )
      expect(quotaRes.ok).toBe(true)
      if (quotaRes.ok) {
        expect(quotaRes.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
          success: true,
          version: expectedVersion,
          status: {
            timer: quotaRes.result.status.timer,
            counter: quotaRes.result.status.counter,
            now: quotaRes.result.status.now,
            disabled: false, // checking that domain is not already disabled
          },
        })
      }
    }

    const testThatValidRequestSucceeds = async () => {
      const res = await OdisUtils.Query.sendOdisDomainRequest(
        await disableRequest(),
        SERVICE_CONTEXT,
        CombinerEndpoint.DISABLE_DOMAIN,
        disableDomainResponseSchema(SequentialDelayDomainStateSchema)
      )

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res).toStrictEqual<DisableDomainResponseSuccess>({
          success: true,
          version: expectedVersion,
          status: {
            timer: res.status.timer,
            now: res.status.now,
            disabled: true, // checking that domain is now disabled
            counter: res.status.counter,
          },
        })
      }
    }

    it('Should succeed on valid request', async () => {
      await testThatDomainIsNotAlreadyDisabled()
      await testThatValidRequestSucceeds()
    })

    it('Should succeed on repeated valid request', async () => {
      await testThatValidRequestSucceeds()
      await testThatValidRequestSucceeds()
    })
  })
})
