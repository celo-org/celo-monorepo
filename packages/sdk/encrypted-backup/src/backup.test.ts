import {
  CircuitBreakerErrorTypes,
  CircuitBreakerKeyStatus,
} from '@celo/identity/lib/odis/circuit-breaker'
import { MockCircuitBreaker } from '@celo/identity/lib/odis/circuit-breaker.mock'
import { defined, noBool } from '@celo/utils/lib/sign-typed-data-utils'
import debugFactory from 'debug'
import { Backup, createBackup, openBackup } from './backup'
import { ComputationalHardeningFunction, HardeningConfig } from './config'
import { BackupErrorTypes } from './errors'
import { MockOdis } from './odis.mock'
import { deserializeBackup, serializeBackup } from './schema'

const debug = debugFactory('kit:encrypted-backup:backup:test')

const TEST_HARDENING_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: [{ delay: 0, resetTimer: noBool, batchSize: defined(3), repetitions: defined(1) }],
    environment: MockOdis.environment,
  },
  circuitBreaker: {
    environment: MockCircuitBreaker.environment,
  },
  computational: {
    function: ComputationalHardeningFunction.SCRYPT,
    cost: 1024,
  },
}

let mockOdis: MockOdis | undefined
let mockCircuitBreaker: MockCircuitBreaker | undefined

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

describe('end-to-end', () => {
  it('should be able to create, serialize, deserialize, and open a backup', async () => {
    const testData = Buffer.from('backup test data', 'utf8')
    const testPassword = Buffer.from('backup test password', 'utf8')
    const testMetadata = {
      name: 'test backup',
      timestamp: Date.now(),
    }

    const backup = await createBackup({
      data: testData,
      userSecret: testPassword,
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
    const opened = await openBackup({ backup: backup.result, userSecret: testPassword })
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
    const reopened = await openBackup({ backup: deserialized.result, userSecret: testPassword })
    debug('Reopen backup result', reopened)
    expect(reopened.ok).toBe(true)
    if (!reopened.ok) {
      return
    }
    expect(reopened.result).toEqual(testData)
  })
})

describe('createBackup', () => {
  const testData = Buffer.from('backup test data', 'utf8')
  const testPassword = Buffer.from('backup test password', 'utf8')

  it('should return a fetch error when request to ODIS fails', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { throws: new Error('fetch failed') })
    const result = await createBackup({
      data: testData,
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
      hardening: { ...TEST_HARDENING_CONFIG, odis: undefined },
    })
    expect(result.ok).toBe(true)
  })

  it('should return a fetch error when the circuit breaker status check fails', async () => {
    mockCircuitBreaker!.installStatusEndpoint(fetchMock, { throws: new Error('fetch failed') })
    const result = await createBackup({
      data: testData,
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
      hardening: { ...TEST_HARDENING_CONFIG, circuitBreaker: undefined },
    })
    expect(result.ok).toBe(true)
  })
})

describe('openBackup', () => {
  const testPassword = Buffer.from('backup test password', 'utf8')
  const testData = Buffer.from('backup test data', 'utf8')
  let testBackup: Backup | undefined

  beforeEach(async () => {
    // Create a backup to use for tests of opening below
    const testBackupResult = await createBackup({
      data: testData,
      userSecret: testPassword,
      hardening: TEST_HARDENING_CONFIG,
    })
    if (!testBackupResult.ok) {
      throw new Error(`failed to create backup for test setup: ${testBackupResult.error}`)
    }
    testBackup = testBackupResult.result
  })

  it('should result in a decryption error if the encrypted data is modified', async () => {
    // Flip a bit in the encrypted data.
    // tslint:disable-next-line:no-bitwise
    testBackup!.encryptedData[0] ^= 0x01
    const result = await openBackup({
      backup: testBackup!,
      userSecret: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.DECRYPTION_ERROR)
  })

  it('should result in a decryption error if odis domain is modified', async () => {
    testBackup!.odisDomain!.salt = defined('some salt')
    const result = await openBackup({
      backup: testBackup!,
      userSecret: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.DECRYPTION_ERROR)
  })

  it('should result in a decryption error if the circuit breaker response changes', async () => {
    mockCircuitBreaker!.installUnwrapKeyEndpoint(fetchMock, {
      status: 200,
      body: { plaintext: Buffer.from('bad fuse key').toString('base64') },
    })
    const result = await openBackup({
      backup: testBackup!,
      userSecret: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.DECRYPTION_ERROR)
  })

  it('should result in a decryption error if the computational hardening is altered', async () => {
    testBackup!.computationalHardening = {
      function: ComputationalHardeningFunction.SCRYPT,
      cost: 16,
    }
    const result = await openBackup({
      backup: testBackup!,
      userSecret: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(BackupErrorTypes.DECRYPTION_ERROR)
  })

  it('should return a fetch error when request to ODIS fails', async () => {
    mockOdis!.installSignEndpoint(fetchMock, { throws: new Error('fetch failed') })
    const result = await openBackup({
      backup: testBackup!,
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
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
      userSecret: testPassword,
    })
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.UNAVAILABLE_ERROR)
  })
})
