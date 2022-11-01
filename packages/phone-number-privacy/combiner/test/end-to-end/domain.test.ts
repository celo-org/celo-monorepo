import {
  buildOdisDomain,
  odisHardenKey,
  odisQueryAuthorizer,
  PASSWORD_HARDENING_ALFAJORES_CONFIG,
  requestOdisDomainQuotaStatus,
} from '@celo/encrypted-backup'
import { OdisUtils } from '@celo/identity'
import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestEIP712,
  disableDomainResponseSchema,
  DisableDomainResponseSuccess,
  DomainQuotaStatusResponseSuccess,
  DomainRequestTypeTag,
  genSessionID,
  SequentialDelayDomain,
  SequentialDelayDomainStateSchema,
} from '@celo/phone-number-privacy-common'
import { defined, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import * as crypto from 'crypto'
import 'isomorphic-fetch'
import { getCombinerVersion } from '../../src'
import { SERVICE_CONTEXT } from './resources'

require('dotenv').config()

jest.setTimeout(60000)

const combinerUrl = process.env.ODIS_COMBINER_SERVICE_URL
const fullNodeUrl = process.env.ODIS_BLOCKCHAIN_PROVIDER

const domain = buildOdisDomain(
  PASSWORD_HARDENING_ALFAJORES_CONFIG.odis!,
  odisQueryAuthorizer(crypto.randomBytes(16)).address
)

describe(`Running against service deployed at ${combinerUrl} w/ blockchain provider ${fullNodeUrl}`, () => {
  it('Service is deployed at correct version', async () => {
    const response = await fetch(combinerUrl + CombinerEndpoint.STATUS, {
      method: 'GET',
    })
    const body = await response.json()
    // This checks against local package.json version, change if necessary
    expect(body.version).toBe(getCombinerVersion())
  })

  describe(`${CombinerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    const testThatValidRequestSucceeds = async () => {
      const res = await requestOdisDomainQuotaStatus(domain, SERVICE_CONTEXT, genSessionID())

      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
          success: true,
          version: getCombinerVersion(),
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

    // TODO figure out how to build an invalid domain
    xit('Should throw on invalid domain', async () => {
      const odisAuthKeySeed = crypto.randomBytes(16)
      const res = await requestOdisDomainQuotaStatus(
        buildOdisDomain(
          PASSWORD_HARDENING_ALFAJORES_CONFIG.odis!,
          odisQueryAuthorizer(odisAuthKeySeed).address
        ),
        SERVICE_CONTEXT,
        genSessionID()
      )

      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
          success: true,
          version: getCombinerVersion(),
          status: {
            timer: res.result.status.timer,
            counter: res.result.status.counter,
            now: res.result.status.now,
            disabled: false,
          },
        })
      }
    })

    // TODO figure out how to provide bad authentication
    xit('Should throw on invalid authentication', async () => {
      const odisAuthKeySeed = crypto.randomBytes(16)
      const res = await requestOdisDomainQuotaStatus(
        buildOdisDomain(
          PASSWORD_HARDENING_ALFAJORES_CONFIG.odis!,
          odisQueryAuthorizer(odisAuthKeySeed).address
        ),
        SERVICE_CONTEXT,
        genSessionID()
      )

      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
          success: true,
          version: getCombinerVersion(),
          status: {
            timer: res.result.status.timer,
            counter: res.result.status.counter,
            now: res.result.status.now,
            disabled: false,
          },
        })
      }
    })
  })

  describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
    const testThatValidRequestSucceeds = async () => {
      const expectedResult: Buffer = Buffer.from('TODO')
      const key = crypto.randomBytes(16)
      const res = await odisHardenKey(key, domain, SERVICE_CONTEXT)
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.result).toEqual(expectedResult)
      }
    }

    it('Should succeed on valid request', async () => {
      await testThatValidRequestSucceeds()
    })

    it('Should succeed on repeated valid request', async () => {
      await testThatValidRequestSucceeds()
      await testThatValidRequestSucceeds()
    })

    // TODO figure out how to build an invalid domain
    xit('Should throw on invalid domain', async () => {
      // const odisAuthKeySeed = crypto.randomBytes(16)
      // const res = await requestOdisDomainQuotaStatus(
      //   buildOdisDomain(
      //     PASSWORD_HARDENING_ALFAJORES_CONFIG.odis!,
      //     odisQueryAuthorizer(odisAuthKeySeed).address
      //   ),
      //   SERVICE_CONTEXT,
      //   genSessionID()
      // )
      // expect(res.ok).toBe(true)
      // if (res.ok) {
      //   expect(res.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
      //     success: true,
      //     version: getCombinerVersion(),
      //     status: {
      //       timer: res.result.status.timer,
      //       counter: res.result.status.counter,
      //       now: res.result.status.now,
      //       disabled: false,
      //     },
      //   })
      // }
    })

    // TODO figure out how to provide bad authentication
    xit('Should throw on invalid authentication', async () => {
      // const odisAuthKeySeed = crypto.randomBytes(16)
      // const res = await requestOdisDomainQuotaStatus(
      //   buildOdisDomain(
      //     PASSWORD_HARDENING_ALFAJORES_CONFIG.odis!,
      //     odisQueryAuthorizer(odisAuthKeySeed).address
      //   ),
      //   SERVICE_CONTEXT,
      //   genSessionID()
      // )
      // expect(res.ok).toBe(true)
      // if (res.ok) {
      //   expect(res.result).toStrictEqual<DomainQuotaStatusResponseSuccess>({
      //     success: true,
      //     version: getCombinerVersion(),
      //     status: {
      //       timer: res.result.status.timer,
      //       counter: res.result.status.counter,
      //       now: res.result.status.now,
      //       disabled: false,
      //     },
      //   })
      // }
    })

    // TODO
    xit('Should throw on out of quota', async () => {
      // TODO
    })
  })

  describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
    const disableRequest = async (): Promise<DisableDomainRequest<SequentialDelayDomain>> => {
      const wallet = new LocalWallet()
      wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
      const walletAddress = wallet.getAccounts()[0]!
      const req: DisableDomainRequest<SequentialDelayDomain> = {
        type: DomainRequestTypeTag.DISABLE,
        domain,
        options: {
          signature: noString,
          nonce: noNumber,
        },
        sessionID: defined(genSessionID()),
      }
      req.options.signature = defined(
        await wallet.signTypedData(walletAddress, disableDomainRequestEIP712(req))
      )
      return req
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
          version: getCombinerVersion(),
          status: {
            timer: res.status.timer,
            now: res.status.now,
            disabled: true,
            counter: res.status.counter,
          },
        })
      }
    }

    it('Should succeed on valid request', async () => {
      await testThatValidRequestSucceeds()
    })

    it('Should succeed on repeated valid request', async () => {
      await testThatValidRequestSucceeds()
      await testThatValidRequestSucceeds()
    })
  })
})
