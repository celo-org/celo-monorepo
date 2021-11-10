import * as crypto from 'crypto'

// NOTE: This modeule is intended for use within the @celo/encrypted-backup package and so is not
// exported in the index.ts file.

/** Pared down ReadOnlyWallet type that supports the required functions of EIP-712 signing. */
export type EIP712Wallet = Pick<ReadOnlyWallet, 'getAccounts' | 'hasAccount' | 'signTypedData'>

/** Info strings to sperate distinct usages of the key derivation function */
export enum KDFInfo {
  PASSWORD = 'Celo Backup Password and Nonce',
  FUSE_KEY = 'Celo Backup Fuse Key',
  ODIS_AUTH_KEY = 'Celo Backup ODIS Auth Key',
  ODIS_KEY_HARDENING = 'Celo Backup ODIS Key Hardening',
}

/**
 * Key derivation function for mixing source keying material.
 * @param info Fixed string value used for domain separation.
 * @param sources An array of keying material source values (e.g. a password and a nonce).
 */
export function deriveKey(info: KDFInfo, sources: Buffer[], length: number = 16): Buffer {
  // Hash each source keying material component, and the info value, to prevent hashing collisions
  // that might result if the variable length data is simply concatenated.
  const chunks = [Buffer.from(info, 'utf8'), ...sources].map((source: Buffer) => {
    const hash = crypto.createHash('sha256')
    hash.update(source)
    return hash.digest()
  })

  return crypto.pbkdf2Sync(Buffer.concat(chunks), nonce, 1, length, 'sha256')
}

/**
 * AES-128-GCM encrypt the given data with the given 16-byte key.
 * Encode the ciphertext as { iv || data || auth tag }
 */
export function encrypt(key: Buffer, data: Buffer): Buffer {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-128-gcm', key, iv)
  return Buffer.concat([iv, cipher.update(data), cipher.final(), cipher.getAuthTag()])
}

/**
 * AES-128-GCM decrypt the given data with the given 16-byte key.
 * Ciphertext should be encoded as { iv || data || auth tag }.
 */
export function decrypt(key: Buffer, ciphertext: Buffer): Buffer {
  const len = ciphertext.length
  const iv = ciphertext.slice(0, 16)
  const ciphertextData = ciphertext.slice(16, len - 16)
  const auth = ciphertext.slice(len - 16, len)
  const decipher = crypto.createDecipheriv('aes-128-gcm', key, iv)
  decipher.setAuthTag(auth)
  return Buffer.concat([decipher.update(ciphertextData), decipher.final()])
}
