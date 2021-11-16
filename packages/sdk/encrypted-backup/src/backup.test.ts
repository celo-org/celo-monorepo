// Setup mock for the fetch API to intercept requests to ODIS and the circuit breaker service.
// cross-fetch is used by the @celo/identity library.
const fetchMock = require('fetch-mock').sandbox()
jest.mock('cross-fetch', () => fetchMock)

import { ServiceContext as OdisServiceContext } from '@celo/identity/lib/odis/query'
import {
  checkSequentialDelayRateLimit,
  domainHash,
  DomainQuotaStatusRequest,
  DomainQuotaStatusResponse,
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse,
  Endpoints,
  SequentialDelayDomain,
  SequentialDelayDomainState,
  verifyDomainQuotaStatusRequestSignature,
  verifyDomainRestrictedSignatureRequestSignature,
} from '@celo/phone-number-privacy-common'
import { defined, noBool } from '@celo/utils/lib/sign-typed-data-utils'
import debugFactory from 'debug'
import { createBackup, openBackup } from './backup'
import { HardeningConfig } from './config'
import { deserializeBackup, serializeBackup } from './schema'

// TODO(victor): Create a more complete set of tests, including a number of error conditions.

// Mock out the BLS blinding client. Verification of the result is not possible without using the
// real BLS OPRF implementation and a set of BLS keys.
jest.mock('@celo/identity/lib/odis/bls-blinding-client', () => {
  // tslint:disable-next-line:no-shadowed-variable
  class WasmBlsBlindingClient {
    blindMessage = (m: string) => m
    unblindAndVerifyMessage = (m: string) => m
  }
  return {
    WasmBlsBlindingClient,
  }
})

const debug = debugFactory('kit:encrypted-backup:backup:test')

const TEST_ODIS_ENVIRONMENT: OdisServiceContext = {
  odisUrl: 'https://mockodis.com',
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}

const TEST_HARDENING_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: [{ delay: 0, resetTimer: noBool, batchSize: defined(3), repetitions: defined(1) }],
    environment: TEST_ODIS_ENVIRONMENT,
  },
}

class MockOdis {
  state: Record<string, SequentialDelayDomainState> = {}

  quota(
    req: DomainQuotaStatusRequest<SequentialDelayDomain>
  ): { status: number; body: DomainQuotaStatusResponse } {
    const authorized = verifyDomainQuotaStatusRequestSignature(req)
    if (!authorized) {
      return {
        status: 401,
        body: {
          success: false,
          version: 'mock',
          error: 'unauthorized',
        },
      }
    }

    const hash = domainHash(req.domain).toString('hex')
    const domainState = this.state[hash] ?? { timer: 0, counter: 0, disabled: false }
    return {
      status: 200,
      body: {
        success: true,
        version: 'mock',
        status: domainState,
      },
    }
  }

  sign(
    req: DomainRestrictedSignatureRequest<SequentialDelayDomain>
  ): { status: number; body: DomainRestrictedSignatureResponse } {
    const authorized = verifyDomainRestrictedSignatureRequestSignature(req)
    if (!authorized) {
      return {
        status: 401,
        body: {
          success: false,
          version: 'mock',
          error: 'unauthorized',
        },
      }
    }

    const hash = domainHash(req.domain).toString('hex')
    const domainState = this.state[hash] ?? { timer: 0, counter: 0, disabled: false }
    const nonce = req.options.nonce.defined ? req.options.nonce.value : undefined
    if (nonce !== domainState.counter) {
      return {
        status: 403,
        body: {
          success: false,
          version: 'mock',
          error: 'incorrect nonce',
        },
      }
    }

    const limitCheck = checkSequentialDelayRateLimit(req.domain, Date.now() / 1000, domainState)
    if (!limitCheck.accepted || limitCheck.state === undefined) {
      return {
        status: 429,
        body: {
          success: false,
          version: 'mock',
          error: 'request limit exceeded',
        },
      }
    }
    this.state[hash] = limitCheck.state

    return {
      status: 200,
      body: {
        success: true,
        version: 'mock',
        signature: `<signature on ${req.blindedMessage}>`,
      },
    }
  }
}

describe('end-to-end', () => {
  beforeEach(() => {
    fetchMock.reset()

    // Mock ODIS using the mock implementation defined above.
    const service = new MockOdis()
    fetchMock.mock(
      {
        url: new URL(Endpoints.DOMAIN_QUOTA_STATUS, TEST_ODIS_ENVIRONMENT.odisUrl).href,
        method: 'POST',
      },
      (url: string, req: { body: string }) => {
        debug('Mocking request', { url, req })
        return service.quota(
          JSON.parse(req.body) as DomainQuotaStatusRequest<SequentialDelayDomain>
        )
      }
    )

    fetchMock.mock(
      {
        url: new URL(Endpoints.DOMAIN_SIGN, TEST_ODIS_ENVIRONMENT.odisUrl).href,
        method: 'POST',
      },
      (url: string, req: { body: string }) => {
        debug('Mocking request', { url, req })
        return service.sign(
          JSON.parse(req.body) as DomainRestrictedSignatureRequest<SequentialDelayDomain>
        )
      }
    )
  })

  afterEach(() => {
    fetchMock.reset()
  })

  it('should be able to create, serialize, deserialize, and open a backup', async () => {
    const testData = Buffer.from('backup test data', 'utf8')
    const testPassword = Buffer.from('backup test password', 'utf8')
    const testMetadata = {
      name: 'test backup',
      timestamp: Date.now(),
    }

    const backup = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
      metadata: testMetadata,
    })
    debug('Created backup result', backup)
    expect(backup.ok).toBe(true)
    if (!backup.ok) {
      return
    }
    expect(backup.result.metadata).toEqual(testMetadata)

    // Attempt to open the backup before passing it through the serialize function.
    const opened = await openBackup({ backup: backup.result, password: testPassword })
    debug('Open backup result', opened)
    expect(opened.ok).toBe(true)
    if (!opened.ok) {
      return
    }
    expect(opened.result).toEqual(testData)

    // Serialize the backup.
    const serialized = serializeBackup(backup.result)
    debug('Serialized backup', serialized)

    // Deserialize the backup, check that it is correctly deserialized and can be opened.
    const deserialized = deserializeBackup(serialized)
    debug('Deserialize backup result', deserialized)
    expect(deserialized.ok).toBe(true)
    if (!deserialized.ok) {
      return
    }
    expect(deserialized.result).toEqual(backup.result)
    expect(deserialized.result.metadata).toEqual(testMetadata)

    // Open the backup and check that that the expect data is recovered.
    const reopened = await openBackup({ backup: deserialized.result, password: testPassword })
    debug('Reopen backup result', reopened)
    expect(reopened.ok).toBe(true)
    if (!reopened.ok) {
      return
    }
    expect(reopened.result).toEqual(testData)
  })
})
