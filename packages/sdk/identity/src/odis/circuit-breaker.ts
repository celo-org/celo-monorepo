import { Err, Ok, Result, RootError } from '@celo/base/lib/result'
import fetch from 'cross-fetch'
import * as crypto from 'crypto'

export const BASE64_REGEXP = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/

export interface CircuitBreakerServiceContext {
  url: string
  publicKey: string
}

export const VALORA_ALFAJORES_CIRCUIT_BREAKER_ENVIRONMENT: CircuitBreakerServiceContext = {
  url: 'https://us-central1-celo-mobile-alfajores.cloudfunctions.net/circuitBreaker/',
  publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi+9UKUsVY5UGYwHFN2M2
90RlNputQeJmSi1phRtQgpXP2RvZK/IFkIygiigXPcFlm7FK35A5qi1HqNTL/2sy
EH+9KnfS5zaUYX0sb2tBiEfzuIh+xLf/MXo1r8fC3MqiIUOZpEDK1XJTxt5XaKC8
+gg1WUyuMw5Qj7ngaEwWaQGCijsJno3aDMuyvt4GceFYCzhj43LnaA3mhili7ghV
uOyKMIHCFd6wvMiSGUfIZRZ7md+zvlAZaWFHFMzbbSYvUIMRtkgfm2phRcXetoha
FCP4PD70/ogeKQswFCiOJo4JKYr3SHujFHq8HgKT3GqJ0JXu3Ry2J/qU29kge6R+
wwIDAQAB
-----END PUBLIC KEY-----`,
}

export const VALORA_MAINNET_CIRCUIT_BREAKER_ENVIRONMENT: CircuitBreakerServiceContext = {
  url: 'https://us-central1-celo-mobile-mainnet.cloudfunctions.net/circuitBreaker/',
  publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsMd1OIdYfTcnYkIXPeym
KSiQmNCEn2DC2mUichrRpJFeb9VO65PeLjMXTIjKyp4TZ3PhXJyK9kEEF27E1wj8
C1WqLIwSP97t1479UHaI7NzAV4nvqvziuP9Zq5fmbxourkMYoXMpZEYNK9OEwEvx
hSQXA1XvYqMALJwRx/8S6taAcJEYenraKiRvxteWqXB6R8HSTxyaOR9qfakZFp1f
d8B9/c3KDiue80yPng1W4AV5GnltoHCcwe97j5gabqztQl8K0yty73wmAFjDB3Ni
cOY/855BxdoOT2XQLs99ytPJJG5uoHKEZbHVzy7d/bagnD08w1/vaeTxyRYuGgfb
mQIDAQAB
-----END PUBLIC KEY-----`,
}

export enum CircuitBreakerKeyStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  DESTROYED = 'DESTROYED',
  UNKNOWN = 'UNKNOWN',
}

export enum CircuitBreakerEndpoints {
  HEALTH = 'health',
  STATUS = 'status',
  UNWRAP_KEY = 'unwrap-key',
}

export interface CircuitBreakerStatusResponse {
  /** Status of the circuit breaker service */
  status: CircuitBreakerKeyStatus
}

export interface CircuitBreakerUnwrapKeyRequest {
  /** RSA-OAEP-256 encrypted data to be unwrapped by the circuit breaker. Encoded as base64 */
  ciphertext: string
}

export interface CircuitBreakerUnwrapKeyResponse {
  /** Decryption of the ciphertext provided to the circuit breaker service */
  plaintext?: string

  /** Error message indicating what went wrong if the ciphertext could not be decrypted */
  error?: string

  /** Status of the circuit breaker service. Included if the service is not enabled. */
  status?: CircuitBreakerKeyStatus
}

export enum CircuitBreakerErrorTypes {
  FETCH_ERROR = 'FETCH_ERROR',
  SERVICE_ERROR = 'CIRCUIT_BREAKER_SERVICE_ERROR',
  UNAVAILABLE_ERROR = 'CIRCUIT_BREAKER_UNAVAILABLE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
}

export class CircuitBreakerServiceError extends RootError<CircuitBreakerErrorTypes.SERVICE_ERROR> {
  constructor(readonly status: number, readonly error?: Error) {
    super(CircuitBreakerErrorTypes.SERVICE_ERROR)
  }
}

export class CircuitBreakerUnavailableError extends RootError<CircuitBreakerErrorTypes.UNAVAILABLE_ERROR> {
  constructor(readonly status: CircuitBreakerKeyStatus) {
    super(CircuitBreakerErrorTypes.UNAVAILABLE_ERROR)
  }
}

export class EncryptionError extends RootError<CircuitBreakerErrorTypes.ENCRYPTION_ERROR> {
  constructor(readonly error?: Error) {
    super(CircuitBreakerErrorTypes.ENCRYPTION_ERROR)
  }
}

export class FetchError extends RootError<CircuitBreakerErrorTypes.FETCH_ERROR> {
  constructor(readonly error?: Error) {
    super(CircuitBreakerErrorTypes.FETCH_ERROR)
  }
}

export type CircuitBreakerError =
  | CircuitBreakerServiceError
  | CircuitBreakerUnavailableError
  | EncryptionError
  | FetchError

/**
 * Client for interacting with a circuit breaker service, such as the one deployed by Valora.
 *
 * @remarks A circuit breaker is a service supporting a public decryption function backed by an HSM
 * key. It is intended for use in key derivation when with ODIS as a key hardening service, and
 * allows the circuit breaker operator to shut down access to the decryption key in the event that
 * ODIS is conpromised. This acts as a safety measure to allow wallets to prevent attackers from
 * being able to brute force their users cryptographic keys in the event that ODIS is compromised,
 * and thus is protection is no longer available.
 *
 * The circuit breaker service is designed for use in encryped cloud backip protocl. More
 * information about encrypted cloud backup and the circuit breaker service can be found in the
 * official {@link https://docs.celo.org/celo-codebase/protocol/identity/encrypted-cloud-backup |
 * Celo documentation}
 */
export class CircuitBreakerClient {
  constructor(readonly environment: CircuitBreakerServiceContext) {}

  protected url(endpoint: CircuitBreakerEndpoints): string {
    // Note that if the result of this is an invalid URL, the URL constructor will throw. This is
    // caught and reported as a fetch error, as a request could not be made.
    return new URL(endpoint, this.environment.url).href
  }

  /**
   * Check the current status of the circuit breaker service. Result will reflect whether or not
   * the circuit breaker keys are currently available.
   */
  async status(): Promise<Result<CircuitBreakerKeyStatus, CircuitBreakerError>> {
    let response: Response
    try {
      response = await fetch(this.url(CircuitBreakerEndpoints.STATUS), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    } catch (error) {
      return Err(new FetchError(error as Error))
    }

    let obj: any
    try {
      obj = await response.json()
    } catch (error) {
      return Err(new CircuitBreakerServiceError(response.status, error as Error))
    }

    // If the response was an error code, return an error to the user.
    // We do not expect an error message to be included with the response from the status endpoint.
    if (!response.ok) {
      return Err(new CircuitBreakerServiceError(response.status))
    }

    if (!Object.values(CircuitBreakerKeyStatus).includes(obj.status)) {
      return Err(
        new CircuitBreakerServiceError(
          response.status,
          new Error(`circuit breaker service returned unexpected response: ${obj.status}`)
        )
      )
    }

    return Ok(obj.status as CircuitBreakerKeyStatus)
  }

  /**
   * RSA-OAEP-256 Encrypt the provided key value against the public key of the circuit breaker.
   *
   * @remarks Note that this is an entirely local procedure and does not require interaction with
   * the circuit breaker service. Encryption occurs only against the service public key.
   */
  wrapKey(plaintext: Buffer): Result<Buffer, EncryptionError> {
    let ciphertext: Buffer
    try {
      ciphertext = crypto.publicEncrypt(
        {
          key: this.environment.publicKey,
          // @ts-ignore support for OAEP hash option, was added in Node 12.9.0.
          oaepHash: 'sha256',
          encoding: 'pem',
        },
        plaintext
      )
    } catch (error) {
      return Err(new EncryptionError(error as Error))
    }
    return Ok(ciphertext)
  }

  /** Request the circuit breaker service to decrypt the provided encrypted key value */
  async unwrapKey(ciphertext: Buffer): Promise<Result<Buffer, CircuitBreakerError>> {
    const request: CircuitBreakerUnwrapKeyRequest = {
      ciphertext: ciphertext.toString('base64'),
    }

    let response: Response
    try {
      response = await fetch(this.url(CircuitBreakerEndpoints.UNWRAP_KEY), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
    } catch (error) {
      return Err(new FetchError(error as Error))
    }

    let obj: any
    try {
      obj = await response.json()
    } catch (error) {
      return Err(new CircuitBreakerServiceError(response.status, error as Error))
    }

    // If the response was an error code, return an error to the user after trying to parse the
    // error from the service response. Either an error message or a status value may be returned.
    if (!response.ok) {
      if (obj.error !== undefined || obj.status === undefined) {
        return Err(new CircuitBreakerServiceError(response.status, obj.error))
      } else {
        return Err(new CircuitBreakerUnavailableError(obj.status))
      }
    }

    const plaintext = obj.plaintext
    if (plaintext === undefined || !BASE64_REGEXP.test(plaintext)) {
      // Plaintext value is not returned in the error as it may has sensitive information.
      const error = new Error('circuit breaker returned invalid plaintext response')
      return Err(new CircuitBreakerServiceError(response.status, error))
    }

    return Ok(Buffer.from(plaintext, 'base64'))
  }
}
