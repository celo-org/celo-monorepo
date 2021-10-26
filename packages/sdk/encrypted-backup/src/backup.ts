import { Domain } from '@celo/identity/lib/odis/domains'
import * as crypto from 'crypto'

export interface Backup {
  // AES-128-GCM encryption of the user's secret backup data.
  encryptedData: Buffer

  // A randomly chosen 128-bit value. Ensures uniqueness of the password derived encryption key.
  // The nonce value is appended to the password for local key derivation. It is also used to derive
  // an authentication key to include in the ODIS Domain for domain seperation and to ensure quota
  // cannot be consumed by parties without access to the backup.
  nonce: Buffer

  // ODIS Domain instance to be included in the query to ODIS for password hardening,
  odisDomain?: Domain

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

export function createBackup(data: Buffer, password: Buffer): Backup {
  const nonce = crypto.randomBytes(16)
  const key = deriveKey(password, nonce)

  // Using the derived key, encrypt the given backup data.
  // Encode the ciphertext as { iv || data || auth tag }
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-128-gcm', key, iv)
  const encryptedData = Buffer.concat([
    iv,
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ])

  // Collect and return the contents of the Backup structure.
  return {
    encryptedData,
    nonce,
    version: '0.0.1',
    metadata: {},
    environment: {},
  }
}

export function openBackup(backup: Backup, password: Buffer): Buffer {
  const key = deriveKey(password, backup.nonce)

  // Using the derived key, decrypt the given backup data.
  // Ciphertext is encoded as { iv || data || auth tag }
  const len = backup.encryptedData.length
  const iv = backup.encryptedData.slice(0, 16)
  const ciphertextData = backup.encryptedData.slice(16, len - 16)
  const auth = backup.encryptedData.slice(len - 16, len)
  const decipher = crypto.createDecipheriv('aes-128-gcm', key, iv)

  decipher.setAuthTag(auth)
  const data = Buffer.concat([decipher.update(ciphertextData), decipher.final()])

  return data
}

export function serializeBackup(backup: Backup): string {
  return JSON.stringify(
    {
      ...backup,
      encryptedData: backup.encryptedData.toString('base64'),
      nonce: backup.nonce.toString('base64'),
    },
    undefined,
    2
  )
}
