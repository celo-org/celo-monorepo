import * as crypto from 'crypto'
import {
  CircuitBreakerClient,
  CircuitBreakerErrorTypes,
  CircuitBreakerKeyStatus,
} from './circuit-breaker'
import { MockCircuitBreaker } from './circuit-breaker.mock'
import fetchMock from '../__mocks__/cross-fetch'

describe('CircuitBreakerClient', () => {
  const client = new CircuitBreakerClient(MockCircuitBreaker.environment)
  let mockService: MockCircuitBreaker | undefined

  beforeEach(() => {
    fetchMock.reset()
    fetchMock.config.overwriteRoutes = true

    // Mock the circuit breaker service using the mock implementation defined above.
    mockService = new MockCircuitBreaker()
    mockService.install(fetchMock)
  })

  afterEach(() => {
    fetchMock.reset()
  })

  describe('.status()', () => {
    it('should fetch the current circuit breaker status', async () => {
      for (const status of Object.values(CircuitBreakerKeyStatus)) {
        mockService!.keyStatus = status
        const result = await client.status()
        expect(result.ok).toBe(true)
        if (!result.ok) {
          continue
        }
        expect(result.result).toEqual(status)
      }
    })

    it('should return an error if fetch throws', async () => {
      mockService!.installStatusEndpoint(fetchMock, { throws: new Error('fetch error') })
      const result = await client.status()
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.FETCH_ERROR)
    })

    it('should return an error if the fetch returns an HTTP error status', async () => {
      mockService!.installStatusEndpoint(fetchMock, { status: 501 })
      const result = await client.status()
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })

    it('should return an error if fetch results in invalid json', async () => {
      mockService!.installStatusEndpoint(fetchMock, { status: 200, body: '<invalid json>' })
      const result = await client.status()
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })

    it('should return an error if fetch results in an invalid status', async () => {
      mockService!.installStatusEndpoint(fetchMock, {
        status: 200,
        body: { status: 'invalid status' },
      })
      const result = await client.status()
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })
  })

  describe('.wrapKey()', () => {
    it('should return an encryption of the given plaintext', async () => {
      const testData = 'test circuit breaker plaintext'
      const ciphertext = client.wrapKey(Buffer.from(testData))
      expect(ciphertext.ok).toBe(true)
      if (!ciphertext.ok) {
        return
      }

      const plaintext = crypto.privateDecrypt(
        //@ts-ignore support for OAEP hash option, was added in Node 12.9.0.
        { key: MockCircuitBreaker.privateKey, oaepHash: 'sha256' },
        ciphertext.result
      )
      expect(plaintext.toString('utf8')).toEqual(testData)
    })
  })

  describe('.unwrapKey()', () => {
    const testData = 'test circuit breaker plaintext'
    const wrapResult = client.wrapKey(Buffer.from(testData))
    if (!wrapResult.ok) {
      throw new Error('failed to produce test ciphertext for unwrapKey')
    }
    const testCiphertext = wrapResult.result

    it('should decrypt the given ciphertext when the service is enabled', async () => {
      const result = await client.unwrapKey(testCiphertext)
      expect(result.ok).toBe(true)
      if (!result.ok) {
        return
      }
      expect(result.result.toString('utf8')).toEqual(testData)
    })

    it('should return an error status response when the service is disabled', async () => {
      for (const status of Object.values(CircuitBreakerKeyStatus)) {
        if (status === CircuitBreakerKeyStatus.ENABLED) {
          continue
        }

        mockService!.keyStatus = status
        const result = await client.unwrapKey(testCiphertext)
        expect(result.ok).toBe(false)
        if (result.ok) {
          continue
        }
        expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.UNAVAILABLE_ERROR)
      }
    })

    it('should return an error if fetch throws', async () => {
      mockService!.installUnwrapKeyEndpoint(fetchMock, { throws: new Error('fetch error') })
      const result = await client.unwrapKey(testCiphertext)
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.FETCH_ERROR)
    })

    it('should return an error if the fetch returns an HTTP error status', async () => {
      mockService!.installUnwrapKeyEndpoint(fetchMock, { status: 501 })
      const result = await client.unwrapKey(testCiphertext)
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })

    it('should return an error if fetch results in invalid json', async () => {
      mockService!.installUnwrapKeyEndpoint(fetchMock, { status: 200, body: '<invalid json>' })
      const result = await client.unwrapKey(testCiphertext)
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })

    it('should return an error if fetch results in an invalid plaintext', async () => {
      mockService!.installUnwrapKeyEndpoint(fetchMock, {
        status: 200,
        body: { plaintext: '<invalid base64>' },
      })
      const result = await client.unwrapKey(testCiphertext)
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })
  })
})
