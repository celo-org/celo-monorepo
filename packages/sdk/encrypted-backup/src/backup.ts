import { Domain, domainHash, isKnownDomain, KnownDomain } from '@celo/identity/lib/odis/domains'
import { Err, Ok, Result } from '@celo/base/lib/result'
import * as crypto from 'crypto'
import { BackupError, InvalidBackupError } from './errors'

// TODO: Change this to KnownDomain?
export interface Backup<D extends Domain = Domain> {
  // AES-128-GCM encryption of the user's secret backup data.
  encryptedData: Buffer

  // A randomly chosen 128-bit value. Ensures uniqueness of the password derived encryption key.
  // The nonce value is appended to the password for local key derivation. It is also used to derive
  // an authentication key to include in the ODIS Domain for domain seperation and to ensure quota
  // cannot be consumed by parties without access to the backup.
  nonce: Buffer

  // ODIS Domain instance to be included in the query to ODIS for password hardening,
  odisDomain?: D

  // RSA-OAEP-256 encryption of a randomly chosen 128-bit value, the fuse key.
  // The fuse key, if provided, is combined with the password in local key derivation. Encryption is
  // under the public key of the circuit breaker service. In order to get the fuseKey the client
  // will send this ciphertext to the circuit breaker service for decryption.
  encryptedFuseKey?: Buffer

  // Version number for the backup feature. Used to facilitate backwards
  // compatibility in future backup feature upgrades.
  version: string

  // TODO(victor): Fill in metadata.
  metadata: {}

  // TODO(victor): Fill in environment.
  environment: {}
}

// Local key derivation from a password and backup nonce.
function deriveKey(password: Buffer, nonce: Buffer): Buffer {
  // PBKDF with a prepended info value to ensure cross-application domain separation.
  // PBKDF is used here only as a standard KDF, without key hardening.
  const info = Buffer.from('Celo Encrypted Backup Key', 'utf8')
  return crypto.pbkdf2Sync(Buffer.concat([info, password]), nonce, 1, 16, 'sha256')
}

/**
 * AES-128-GCM encrypt the given data with the given 16-byte key.
 * Encode the ciphertext as { iv || data || auth tag }
 */
function encrypt(key: Buffer, data: Buffer): Buffer {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-128-gcm', key, iv)
  return Buffer.concat([iv, cipher.update(data), cipher.final(), cipher.getAuthTag()])
}

/**
 * AES-128-GCM decrypt the given data with the given 16-byte key.
 * Ciphertext should be encoded as { iv || data || auth tag }.
 */
function decrypt(key: Buffer, ciphertext: Buffer): Buffer {
  const len = ciphertext.length
  const iv = ciphertext.slice(0, 16)
  const ciphertextData = ciphertext.slice(16, len - 16)
  const auth = ciphertext.slice(len - 16, len)
  const decipher = crypto.createDecipheriv('aes-128-gcm', key, iv)
  decipher.setAuthTag(auth)
  return Buffer.concat([decipher.update(ciphertextData), decipher.final()])
}

export function createBackup<D extends KnownDomain = never>(
  data: Buffer,
  password: Buffer,
  domain?: D
): Backup<D> {
  const nonce = crypto.randomBytes(16)
  let key = deriveKey(password, nonce)

  // TODO: Replace this with ODIS.
  if (domain !== undefined) {
    key = deriveKey(key, domainHash(domain))
  }

  // TODO: Replace this with a proper circuit breaker impl.
  const fuseKey = crypto.randomBytes(16)
  key = deriveKey(key, fuseKey)

  // Encrypted and wrap the data in a Backup structure.
  return {
    encryptedData: encrypt(key, data),
    nonce,
    odisDomain: domain,
    encryptedFuseKey: fuseKey,
    version: '0.0.1',
    metadata: {},
    environment: {},
  }
}

export function openBackup(backup: Backup, password: Buffer): Result<Buffer, BackupError> {
  let key = deriveKey(password, backup.nonce)

  // TODO: Replace this with ODIS.
  if (backup.odisDomain !== undefined) {
    if (!isKnownDomain(backup.odisDomain)) {
      return Err(new InvalidBackupError())
    }

    key = deriveKey(key, domainHash(backup.odisDomain))
  }

  // TODO: Replace this with a proper circuit breaker impl.
  if (backup.encryptedFuseKey !== undefined) {
    key = deriveKey(key, backup.encryptedFuseKey)
  }

  return Ok(decrypt(key, backup.encryptedData))
}
