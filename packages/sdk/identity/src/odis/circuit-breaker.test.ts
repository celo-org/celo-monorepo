import * as crypto from 'crypto'
import debugFactory from 'debug'
import {
  BASE64_REGEXP,
  CircuitBreakerClient,
  CircuitBreakerEndpoints,
  CircuitBreakerErrorTypes,
  CircuitBreakerKeyStatus,
  CircuitBreakerStatusResponse,
  CircuitBreakerServiceContext,
  CircuitBreakerUnwrapKeyRequest,
  CircuitBreakerUnwrapKeyResponse,
} from './circuit-breaker'

const debug = debugFactory('kit:identity:odis:circuit-breaker:test')

export const MOCK_CIRCUIT_BREAKER_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDGtxUPljt+oHFBf3RrDZHN9TbT
iI0kK4bv02Z2WP7kU/PQCikWqNl9/VjGVXuGMlfwpcWZrjWwJa+kBlUYRXH/inXW
UKO5PqTnaUXS1ALasGAUvzRz3VvzCxpjKsjVS8/gAoJbY2Imwor432OLrOssNoK7
jbl1TgaV47yGCKwF9wIDAQAB
-----END PUBLIC KEY-----`

export const MOCK_CIRCUIT_BREAKER_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAMa3FQ+WO36gcUF/
dGsNkc31NtOIjSQrhu/TZnZY/uRT89AKKRao2X39WMZVe4YyV/ClxZmuNbAlr6QG
VRhFcf+KddZQo7k+pOdpRdLUAtqwYBS/NHPdW/MLGmMqyNVLz+ACgltjYibCivjf
Y4us6yw2gruNuXVOBpXjvIYIrAX3AgMBAAECgYBGPqv8QZAweAjxLVv7B+X112wV
JN033wcpOiKrTVR1ZFP4w864iuGvTuKV4dvzmVJK6F7Mr6+c4AWRxwdHuCzOlwxj
O9RySFAXhoENu70zg8W2w4i8GMHsmdnNk045cF01Mb3GtQ6Y3uGb637XYTIwMEbC
Q74TbkrfPZPcSIpPEQJBAP4VModTr47oNvdyJITQ3fzIarRSDU0deZTpn6MXB3a1
abOAzlqYK3CSvLyyM9GOB9C5wvIZev+aNU9SkqPzU38CQQDINu7nOqS2X8UXQ5sS
wFrnoBQcU78i7Jaopvw0kOvkvklHlKVvXVkWP8PaWYdUAO9fpEdKdRnfaOEnqBwT
aymJAkEAgTXmbEtyjAoracryJ1jQiyyglvLjMMQ8gC4OsLGVahj3mAF47zlTXfxB
XvSAxaCk+NB/Av9SPYn+ckhbqmSjoQJAYb6H1bVIkoyg0OG9hGMKPkhlaQrtpmQw
jTewqw0RTQQlDGAigALnqjgJKsFIkxc9xciS0WPn9KzkNxMYWdaYWQJBAI8asXXb
XF5Lg2AAM2xJ/SS+h+si4f70eZey4vo9pWB3Q+VKbtRZu2pCjlR1A1nIqigJxdlc
1jHX+4GiW+t0w8Q=
-----END PRIVATE KEY-----`

const TEST_CIRCUIT_BREAKER_ENVIRONMENT: CircuitBreakerServiceContext = {
  url: 'https://mockcircuitbreaker.com/',
  publicKey: MOCK_CIRCUIT_BREAKER_PUBLIC_KEY,
}

/**
 * Mock circuit breaker implementation based on Valora implementaion
 * github.com/valora-inc/wallet/tree/main/packages/cloud-functions/src/circuitBreaker/circuitBreaker.ts
 */
export class MockCircuitBreaker {
  public keyStatus: CircuitBreakerKeyStatus = CircuitBreakerKeyStatus.ENABLED

  status(): { status: number; body: CircuitBreakerStatusResponse } {
    return {
      status: 200,
      body: { status: this.keyStatus },
    }
  }

  unwrapKey(
    req: CircuitBreakerUnwrapKeyRequest
  ): { status: number; body: CircuitBreakerUnwrapKeyResponse } {
    const { ciphertext } = req
    if (!ciphertext) {
      return {
        status: 400,
        body: { error: '"ciphertext" parameter must be provided' },
      }
    } else if (!BASE64_REGEXP.test(ciphertext)) {
      return {
        status: 400,
        body: { error: '"ciphertext" parameter must be a base64 encoded buffer' },
      }
    }

    if (this.keyStatus !== CircuitBreakerKeyStatus.ENABLED) {
      return {
        status: 503,
        body: { status: this.keyStatus },
      }
    }

    let plaintext: Buffer
    try {
      plaintext = crypto.privateDecrypt(
        //@ts-ignore support for OAEP hash option, was added in Node 12.9.0.
        { key: MOCK_CIRCUIT_BREAKER_PRIVATE_KEY, oaepHash: 'sha256' },
        Buffer.from(ciphertext, 'base64')
      )
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Error while decrypting ciphertext' },
      }
    }

    return {
      status: 200,
      body: { plaintext: plaintext.toString('base64') },
    }
  }
}

describe('CircuitBreakerClient', () => {
  const client = new CircuitBreakerClient(TEST_CIRCUIT_BREAKER_ENVIRONMENT)
  let mockService: MockCircuitBreaker | undefined

  const mockStatusEndpoint = {
    url: new URL(CircuitBreakerEndpoints.STATUS, TEST_CIRCUIT_BREAKER_ENVIRONMENT.url).href,
    method: 'GET',
  }

  const mockUnwrapKeyEndpoint = {
    url: new URL(CircuitBreakerEndpoints.UNWRAP_KEY, TEST_CIRCUIT_BREAKER_ENVIRONMENT.url).href,
    method: 'POST',
  }

  beforeEach(() => {
    fetchMock.reset()
    fetchMock.config.overwriteRoutes = true

    // Mock the circuit breaker service using the mock implementation defined above.
    mockService = new MockCircuitBreaker()
    fetchMock.mock(mockStatusEndpoint, (url: string, req: unknown) => {
      debug('Mocking request', { url, req })
      return mockService!.status()
    })

    fetchMock.mock(mockUnwrapKeyEndpoint, (url: string, req: { body: string }) => {
      debug('Mocking request', { url, req })
      return mockService!.unwrapKey(JSON.parse(req.body) as CircuitBreakerUnwrapKeyRequest)
    })
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
      fetchMock.mock(mockStatusEndpoint, { throws: new Error('fetch error') })
      const result = await client.status()
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.FETCH_ERROR)
    })

    it('should return an error if the fetch returns an HTTP error status', async () => {
      fetchMock.mock(mockStatusEndpoint, { status: 501 })
      const result = await client.status()
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })

    it('should return an error if fetch results in invalid json', async () => {
      fetchMock.mock(mockStatusEndpoint, { status: 200, body: '<invalid json>' })
      const result = await client.status()
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })

    it('should return an error if fetch results in an invalid status', async () => {
      fetchMock.mock(mockStatusEndpoint, { status: 200, body: { status: 'invalid status' } })
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
        { key: MOCK_CIRCUIT_BREAKER_PRIVATE_KEY, oaepHash: 'sha256' },
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
        expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
      }
    })

    it('should return an error if fetch throws', async () => {
      fetchMock.mock(mockUnwrapKeyEndpoint, { throws: new Error('fetch error') })
      const result = await client.unwrapKey(testCiphertext)
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.FETCH_ERROR)
    })

    it('should return an error if the fetch returns an HTTP error status', async () => {
      fetchMock.mock(mockUnwrapKeyEndpoint, { status: 501 })
      const result = await client.unwrapKey(testCiphertext)
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })

    it('should return an error if fetch results in invalid json', async () => {
      fetchMock.mock(mockUnwrapKeyEndpoint, { status: 200, body: '<invalid json>' })
      const result = await client.unwrapKey(testCiphertext)
      expect(result.ok).toBe(false)
      if (result.ok) {
        return
      }
      expect(result.error.errorType).toEqual(CircuitBreakerErrorTypes.SERVICE_ERROR)
    })

    it('should return an error if fetch results in an invalid plaintext', async () => {
      fetchMock.mock(mockUnwrapKeyEndpoint, {
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
