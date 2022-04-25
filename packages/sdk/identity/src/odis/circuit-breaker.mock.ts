import * as crypto from 'crypto'
import debugFactory from 'debug'
import {
  BASE64_REGEXP,
  CircuitBreakerEndpoints,
  CircuitBreakerKeyStatus,
  CircuitBreakerServiceContext,
  CircuitBreakerStatusResponse,
  CircuitBreakerUnwrapKeyRequest,
  CircuitBreakerUnwrapKeyResponse,
} from './circuit-breaker'

const debug = debugFactory('kit:identity:odis:circuit-breaker:mock')

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

const MOCK_CIRCUIT_BREAKER_ENVIRONMENT: CircuitBreakerServiceContext = {
  url: 'https://mockcircuitbreaker.com/',
  publicKey: MOCK_CIRCUIT_BREAKER_PUBLIC_KEY,
}

/**
 * Mock circuit breaker implementation based on Valora implementaion
 * github.com/valora-inc/wallet/tree/main/packages/cloud-functions/src/circuitBreaker/circuitBreaker.ts
 */
export class MockCircuitBreaker {
  static readonly publicKey = MOCK_CIRCUIT_BREAKER_PUBLIC_KEY
  static readonly privateKey = MOCK_CIRCUIT_BREAKER_PRIVATE_KEY
  static readonly environment = MOCK_CIRCUIT_BREAKER_ENVIRONMENT

  public keyStatus: CircuitBreakerKeyStatus = CircuitBreakerKeyStatus.ENABLED

  status(): { status: number; body: CircuitBreakerStatusResponse } {
    return {
      status: 200,
      body: { status: this.keyStatus },
    }
  }

  unwrapKey(req: CircuitBreakerUnwrapKeyRequest): {
    status: number
    body: CircuitBreakerUnwrapKeyResponse
  } {
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
        // @ts-ignore support for OAEP hash option, was added in Node 12.9.0.
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

  installStatusEndpoint(mock: typeof fetchMock, override?: any) {
    mock.mock(
      {
        url: new URL(CircuitBreakerEndpoints.STATUS, MockCircuitBreaker.environment.url).href,
        method: 'GET',
      },
      override ??
        ((url: string, req: unknown) => {
          debug('Mocking request', { url, req })
          return this.status()
        })
    )
  }

  installUnwrapKeyEndpoint(mock: typeof fetchMock, override?: any) {
    mock.mock(
      {
        url: new URL(CircuitBreakerEndpoints.UNWRAP_KEY, MockCircuitBreaker.environment.url).href,
        method: 'POST',
      },
      override ??
        ((url: string, req: { body: string }) => {
          debug('Mocking request', { url, req })
          return this.unwrapKey(JSON.parse(req.body) as CircuitBreakerUnwrapKeyRequest)
        })
    )
  }

  install(mock: typeof fetchMock) {
    this.installStatusEndpoint(mock)
    this.installUnwrapKeyEndpoint(mock)
  }
}
