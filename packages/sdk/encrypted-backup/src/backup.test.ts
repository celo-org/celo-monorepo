// Setup mock for the fetch API to intercept requests to ODIS and the circuit breaker service.
// cross-fetch is used by the @celo/identity library.
const fetchMock = require('fetch-mock').sandbox()
jest.mock('cross-fetch', () => fetchMock)

import {
  CircuitBreakerErrorTypes,
  CircuitBreakerKeyStatus,
} from '@celo/identity/lib/odis/circuit-breaker'
import { MockCircuitBreaker } from '@celo/identity/lib/odis/circuit-breaker.mock'
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
import { Backup, createBackup, openBackup } from './backup'
import { HardeningConfig } from './config'
import { BackupErrorTypes } from './errors'
import { deserializeBackup, serializeBackup } from './schema'

const debug = debugFactory('kit:encrypted-backup:backup:test')

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

const MOCK_ODIS_ENVIRONMENT: OdisServiceContext = {
  odisUrl: 'https://mockodis.com',
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}

class MockOdis {
  static readonly environment = MOCK_ODIS_ENVIRONMENT

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

  installQuotaEndpoint(mock: typeof fetchMock, override?: any) {
    mock.mock(
      {
        url: new URL(Endpoints.DOMAIN_QUOTA_STATUS, MockOdis.environment.odisUrl).href,
        method: 'POST',
      },
      override ??
        ((url: string, req: { body: string }) => {
          debug('Mocking request', { url, req })
          return this.quota(JSON.parse(req.body) as DomainQuotaStatusRequest<SequentialDelayDomain>)
        })
    )
  }

  installSignEndpoint(mock: typeof fetchMock, override?: any) {
    mock.mock(
      {
        url: new URL(Endpoints.DOMAIN_SIGN, MockOdis.environment.odisUrl).href,
        method: 'POST',
      },
      override ??
        ((url: string, req: { body: string }) => {
          debug('Mocking request', { url, req })
          return this.sign(
            JSON.parse(req.body) as DomainRestrictedSignatureRequest<SequentialDelayDomain>
          )
        })
    )
  }

  install(mock: typeof fetchMock) {
    this.installQuotaEndpoint(mock)
    this.installSignEndpoint(mock)
  }
}

const TEST_HARDENING_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: [{ delay: 0, resetTimer: noBool, batchSize: defined(3), repetitions: defined(1) }],
    environment: MockOdis.environment,
  },
  circuitBreaker: {
    environment: MockCircuitBreaker.environment,
  },
}

describe('end-to-end', () => {
  beforeEach(() => {
    fetchMock.reset()

    // Mock ODIS using the mock implementation defined above.
    const mockOdis = new MockOdis()
    mockOdis.install(fetchMock)

    // Mock the circuit breaker service using the implementation from the identity library.
    const mockCircuitBreaker = new MockCircuitBreaker()
    mockCircuitBreaker.install(fetchMock)
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

describe('createBackup', () => {
  let mockOdis: MockOdis | undefined
  let mockCircuitBreaker: MockCircuitBreaker | undefined

  const testData = Buffer.from('backup test data', 'utf8')
  const testPassword = Buffer.from('backup test password', 'utf8')

  beforeEach(() => {
    fetchMock.reset()
    fetchMock.config.overwriteRoutes = true

    // Mock ODIS using the mock implementation defined above.
    mockOdis = new MockOdis()
    mockOdis.install(fetchMock)

    // Mock the circuit breaker service using the implementation from the identity library.
    mockCircuitBreaker = new MockCircuitBreaker()
    mockCircuitBreaker.install(fetchMock)
  })

  afterEach(() => {
    fetchMock.reset()
  })

  it('should return a fetch error when request to ODIS fails', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { throws: new Error('fetch failed') })
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.FETCH_ERROR)
  })

  it('should return a service error when ODIS returns an error status', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { status: 501 })
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.ODIS_SERVICE_ERROR)
  })

  it('should return a rate limit error when ODIS returns a rate limiting status', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { status: 429, headers: { 'Retry-After': '60' } })
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.ODIS_RATE_LIMITING_ERROR)
  })

  it('should return a rate limit error when ODIS indicates no quota available', async () => {
    mockOdis!.installQuotaEndpoint(fetchMock, {
      status: 200,
      body: {
        success: true,
        version: 'mock',
        status: { timer: Date.now() / 1000 + 3600, counter: 0, disabled: false },
      },
    })
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.ODIS_RATE_LIMITING_ERROR)
  })

  it('should not rely on ODIS when not included in the configuration', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { status: 501 })
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: { ...TEST_HARDENING_CONFIG, odis: undefined },
    })
    expect(result.ok).toBe(true)
  })

  it('should return a fetch error when the circuit breaker status check fails', async () => {
    mockCircuitBreaker!.installStatusEndpoint(fetchMock, { throws: new Error('fetch failed') })
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.FETCH_ERROR)
  })

  it('should return a service error when the circuit breaker service returns 501', async () => {
    mockCircuitBreaker!.installStatusEndpoint(fetchMock, { status: 501 })
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
  })

  it('should return an unavailable error when the circuit breaker key is destroyed', async () => {
    mockCircuitBreaker!.keyStatus = CircuitBreakerKeyStatus.DESTROYED
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.UNAVAILABLE_ERROR)
  })

  it('should not rely on the circuit breaker when not included in the configuration', async () => {
    mockCircuitBreaker!.installStatusEndpoint(fetchMock, { status: 501 })
    const result = await createBackup({
      data: testData,
      password: testPassword,
      hardening: { ...TEST_HARDENING_CONFIG, circuitBreaker: undefined },
    })
    expect(result.ok).toBe(true)
  })
})

describe('openBackup', () => {
  let mockOdis: MockOdis | undefined
  let mockCircuitBreaker: MockCircuitBreaker | undefined

  const testPassword = Buffer.from('backup test password', 'utf8')
  const testData = Buffer.from('backup test data', 'utf8')
  let testBackup: Backup | undefined

  beforeEach(async () => {
    fetchMock.reset()
    fetchMock.config.overwriteRoutes = true

    // Mock ODIS using the mock implementation defined above.
    mockOdis = new MockOdis()
    mockOdis.install(fetchMock)

    // Mock the circuit breaker service using the implementation from the identity library.
    mockCircuitBreaker = new MockCircuitBreaker()
    mockCircuitBreaker.install(fetchMock)

    // Create a backup to use for tests of opening below
    const testBackupResult = await createBackup({
      data: testData,
      password: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    if (!testBackupResult.ok) {
      throw new Error(`failed to create backup for test setup: ${testBackupResult.error}`)
    }
    testBackup = testBackupResult.result
  })

  afterEach(() => {
    fetchMock.reset()
  })

  it('should return a fetch error when request to ODIS fails', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { throws: new Error('fetch failed') })
    const result = await openBackup({
      backup: testBackup!,
      password: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.FETCH_ERROR)
  })

  it('should return a service error when ODIS returns an error status', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { status: 501 })
    const result = await openBackup({
      backup: testBackup!,
      password: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.ODIS_SERVICE_ERROR)
  })

  it('should return a rate limit error when ODIS returns a rate limiting status', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { status: 429, headers: { 'Retry-After': '60' } })
    const result = await openBackup({
      backup: testBackup!,
      password: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.ODIS_RATE_LIMITING_ERROR)
  })

  it('should return a rate limit error when ODIS indicates no quota available', async () => {
    mockOdis!.installQuotaEndpoint(fetchMock, {
      status: 200,
      body: {
        success: true,
        version: 'mock',
        status: { timer: Date.now() / 1000 + 3600, counter: 0, disabled: false },
      },
    })
    const result = await openBackup({
      backup: testBackup!,
      password: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.ODIS_RATE_LIMITING_ERROR)
  })

  it('should return a fetch error when circuit breaker unwrap key fails', async () => {
    mockCircuitBreaker!.installUnwrapKeyEndpoint(fetchMock, { throws: new Error('fetch failed') })
    const result = await openBackup({
      backup: testBackup!,
      password: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.FETCH_ERROR)
  })

  it('should return a service error when the circuit breaker service returns 501', async () => {
    mockCircuitBreaker!.installUnwrapKeyEndpoint(fetchMock, { status: 501 })
    const result = await openBackup({
      backup: testBackup!,
      password: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
  })

  it('should return an unavailable error when the circuit breaker key is destroyed', async () => {
    mockCircuitBreaker!.keyStatus = CircuitBreakerKeyStatus.DESTROYED
    const result = await openBackup({
      backup: testBackup!,
      password: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.UNAVAILABLE_ERROR)
  })
})
