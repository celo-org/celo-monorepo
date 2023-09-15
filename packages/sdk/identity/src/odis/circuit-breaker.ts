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
MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAsYkNg3iY1ha4KGCGvHLl
mOMKV63lq+WsHIgUGfEuyfOWEBetVux9gvQEEPYpKbHgVQrfcegp28LoZYehWZHC
dIHSACcW0SGZagSOFEgxVSY6MgZZjmbTdlUtLac2cvxIDx8qhkoBjWRWu4g5LfdW
9QA0tiM3dR/pmA8YWcIYtyjGY1zglA/YqHClKsDRY+dbhshfILfohdFsVNJ3CWLS
J4yGvVe78AE/WiaXISV5ol+bqve4QlxzbBLIV4s44YONCh18/YhmGHCuSn8yy1/0
q3YW7COaFEGd7m8VnV2rU/dFLKyF0XEanS6xk9ciL9uafR9dMryEQ7AW+yKmfQBG
H2i5uiKnWW2a3a873ShG2Qphl9mw1Kcrdxug4qk9y7RoKlMnG3Wdr4HMQb9S8KYf
07ZyVEbFip26ANWGo8dCA8fWvVtU5DByoWPI+PuglOB22z2noXov98imSFJfz9vu
yGAQt3CUOwUQvt+RObDXiHHIxJjU+6/81X3Jdnt3dFEfAgMBAAE=
-----END PUBLIC KEY-----`,
}

export const VALORA_MAINNET_CIRCUIT_BREAKER_ENVIRONMENT: CircuitBreakerServiceContext = {
  url: 'https://us-central1-celo-mobile-mainnet.cloudfunctions.net/circuitBreaker/',
  publicKey: `-----BEGIN PUBLIC KEY-----
MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEArQ89m/HIGECXR7ceZZRS
b6MZEw1S1o5qgi6sLEejBMUQhM/wgySoo5ydiW7S4iyiqEksQNAlOs5Mrv1aE9Ul
bG+rpglOA1xYLyjY7xUZE2tyPksPXcSKgu6d+G9gVtbmFld1Kr0jVx4qOLejtH3S
dGbX6g9GshgB1W4iEDZ4qEJBuvItSTudK3BFM1mBfEq1w3kDxNzYKC1zFlw+DWWh
BgIPB7zEp+MJNTwel2z7H02wsEMJMXzKwaAWaDp8PYfF3RwgCDIFkf+QteYIEUrG
C9bFhdYpDGY9Ldiz7kca9G9dvXWpZUQOYyOY7CFx0k2XcTBwx4Lq524lNR8waIDu
OT5jj2SIwXf5eKtyFMUqRNnqgs+IHHcWgh0CH7mfhPlFBMivKlwHgQqCJH3rHlgu
CMi3ENv4+p7+svshngntxGkEzZcLV3YVW7BG6xSOAqC1tjkM1PkmXENQOq+bxAL6
bg3W6cTRQAQxoicu6+1c5Tdb/K36TXx0mHan7/Z8JCqfAgMBAAE=
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
 * Client for interacting with a circuit breaker service for encrypted cloud backups.
 *
 * @remarks A circuit breaker is a service supporting a public decryption function backed by an HSM
 * key. If the need arises, the circuit breaker operator may take the decryption function offline.
 * A client can encrypt data to the circuit breaker public key and store it in a non-public place.
 * This data will then be available under normal circumstances, but become unavailable in the case
 * of an emergency.
 *
 * It is intended for use in password-based key derivation when ODIS is used as a key hardening
 * function. Clients may include in their key dervivation a random value which they encrypt to the
 * circuit breaker public key. This allows the circuit breaker operator to disable key derivation,
 * by restricting access to the encrypted keying material, in the event that ODIS is conpromised.
 * This acts as a safety measure to allow wallet providers, or other users of ODIS key hardening, to
 * prevent attackers from being able to brute force their users' derived keys in the event that
 * ODIS is compromised such that it can no longer add to the key hardening.
 *
 * The circuit breaker service is designed for use in the encrypted cloud backup protocol. More
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
          oaepHash: 'sha256',
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
