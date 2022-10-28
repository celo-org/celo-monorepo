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
  DomainQuotaStatusResponseSuccess,
  genSessionID,
} from '@celo/phone-number-privacy-common'
import * as crypto from 'crypto'
import 'isomorphic-fetch'
import { VERSION } from '../../src/config'
import { SERVICE_CONTEXT } from './resources'

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

  describe(`${CombinerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    const testThatValidRequestSucceeds = async () => {
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
          version: VERSION,
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
          version: VERSION,
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
          version: VERSION,
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

  // TODO
  describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
    odisHardenKey
  })

  // TODO
  describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
    OdisUtils.Query.sendOdisDomainRequest
  })
})
