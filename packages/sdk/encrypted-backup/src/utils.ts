import { Err, Ok, Result } from '@celo/base/lib/result'
import { ReadOnlyWallet } from '@celo/connect'
import * as crypto from 'crypto'
import { ComputationalHardeningConfig, ComputationalHardeningFunction } from './config'
import { DecryptionError, EncryptionError, PbkdfError, ScryptError } from './errors'

// NOTE: This module is intended for use within the @celo/encrypted-backup package and so is not
// exported in the index.ts file.

/** Pared down ReadOnlyWallet type that supports the required functions of EIP-712 signing. */
export type EIP712Wallet = Pick<ReadOnlyWallet, 'getAccounts' | 'hasAccount' | 'signTypedData'>

/** Info strings to separate distinct usages of the key derivation function */
export enum KDFInfo {
  PASSWORD = 'Celo Backup Password and Nonce',
  FUSE_KEY = 'Celo Backup Fuse Key',
  ODIS_AUTH_KEY = 'Celo Backup ODIS Request Authorization Key',
  ODIS_KEY_HARDENING = 'Celo Backup ODIS Key Hardening',
  PBKDF = 'Celo Backup PBKDF Hardening',
  SCRYPT = 'Celo Backup scrypt Hardening',
  FINALIZE = 'Celo Backup Key Finalization',
}

/**
 * Key derivation function for mixing source keying material.
 *
 * @remarks This function does not add any hardening to the input keying material. It is used only
 * to mix the provided key material sources. It's output should not be used to directly derive a key
 * from a password or other low entropy sources.
 *
 * @param info Fixed string value used for domain separation.
 * @param sources An array of keying material source values (e.g. a password and a nonce).
 */
export function deriveKey(info: KDFInfo, sources: Buffer[]): Buffer {
  // Hash each source keying material component, and the info value, to prevent hashing collisions
  // that might result if the variable length data is simply concatenated.
  const chunks = [Buffer.from(info, 'utf8'), ...sources].map((source: Buffer) => {
    const hash = crypto.createHash('sha256')
    hash.update(source)
    return hash.digest()
  })

  // NOTE: We would prefer to use HKDF here, but is only available in Node v15 and above.
  return crypto.pbkdf2Sync(Buffer.concat(chunks), Buffer.alloc(0), 1, 32, 'sha256')
}

/**
 * AES-256-GCM encrypt the given data with the given 32-byte key.
 * Encode the ciphertext as { iv || data || auth tag }
 */
export function encrypt(key: Buffer, data: Buffer): Result<Buffer, EncryptionError> {
  try {
    // NOTE: AES-GCM uses a 12-byte nonce. Longer nonces get hashed before use.
    const nonce = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce)
    return Ok(Buffer.concat([nonce, cipher.update(data), cipher.final(), cipher.getAuthTag()]))
  } catch (error) {
    return Err(new EncryptionError(error as Error))
  }
}

/**
 * AES-256-GCM decrypt the given data with the given 32-byte key.
 * Ciphertext should be encoded as { iv || data || auth tag }.
 */
export function decrypt(key: Buffer, ciphertext: Buffer): Result<Buffer, DecryptionError> {
  const len = ciphertext.length
  if (len < 28) {
    return Err(
      new DecryptionError(
        new Error(`ciphertext is too short: expected at least 28 bytes, but got ${len}`)
      )
    )
  }

  try {
    // NOTE: AES-GCM uses a 12-byte nonce. Longer nonces get hashed before use.
    const nonce = ciphertext.slice(0, 12)
    const ciphertextData = ciphertext.slice(12, len - 16)
    const auth = ciphertext.slice(len - 16, len)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    decipher.setAuthTag(auth)
    return Ok(Buffer.concat([decipher.update(ciphertextData), decipher.final()]))
  } catch (error) {
    return Err(new DecryptionError(error as Error))
  }
}

/**
 * PBKDF2-SHA256 computational key hardening.
 *
 * @remarks When possible, a memory hard function such as scrypt should be used instead.
 * No salt parameter is provided as the intended use case of this function is to harden a
 * key value which is derived from a password but already has the salt mixed in.
 *
 * @see { @link
 * https://nodejs.org/api/crypto.html#cryptopbkdf2password-salt-iterations-keylen-digest-callback |
 * NodeJS crypto.pbkdf2 API }
 *
 * @param key Key buffer to compute hardening against. Should have a salt or nonce mixed in.
 * @param iterations Number of PBKDF2 iterations to execute for key hardening.
 */
export function pbkdf2(key: Buffer, iterations: number): Promise<Result<Buffer, PbkdfError>> {
  return new Promise((resolve) => {
    crypto.pbkdf2(key, KDFInfo.PBKDF, iterations, 32, 'sha256', (error, result) => {
      if (error) {
        resolve(Err(new PbkdfError(iterations, error)))
      }
      resolve(Ok(result))
    })
  })
}

/** Cost parameters for the scrypt computational hardening function. */
export interface ScryptOptions {
  cost: number
  blockSize?: number
  parallelization?: number
}

/**
 * scrypt computational key hardening.
 *
 * @remarks No salt parameter is provided as the intended use case of this function is to harden a
 * key value which is derived from a password but already has the salt mixed in.
 *
 * @see { @link
 * https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback |
 * NodeJS crypto.scrypt API }
 *
 * @param key Key buffer to compute hardening against. Should have a salt or nonce mixed in.
 * @param options Options to control the cost of the scrypt function.
 */
export function scrypt(key: Buffer, options: ScryptOptions): Promise<Result<Buffer, ScryptError>> {
  // Define the maxmem parameter to be large enough to accommodate the provided options.
  // See the Node JS crypto implementation of scrypt for more detail.
  const maxmem = Math.max(32 * 1024 * 1024, 128 * options.cost * (options.blockSize ?? 8))
  return new Promise((resolve) => {
    crypto.scrypt(key, KDFInfo.SCRYPT, 32, { maxmem, ...options }, (error, result) => {
      if (error) {
        resolve(Err(new ScryptError(options, error)))
      }
      resolve(Ok(result))
    })
  })
}

export function computationalHardenKey(
  key: Buffer,
  config: ComputationalHardeningConfig
): Promise<Result<Buffer, PbkdfError | ScryptError>> {
  switch (config.function) {
    case ComputationalHardeningFunction.PBKDF:
      return pbkdf2(key, config.iterations)
    case ComputationalHardeningFunction.SCRYPT:
      return scrypt(key, config)
  }
}
