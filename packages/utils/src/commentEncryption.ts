import { randomBytes } from 'crypto'
import { ec as EC } from 'elliptic'
import { memoize } from 'lodash'
import {
  AES128DecryptAndHMAC,
  AES128EncryptAndHMAC,
  Decrypt as ECIESDecrypt,
  Encrypt as ECIESEncrypt,
} from './ecies'
const hkdf = require('futoin-hkdf')
const ec = new EC('secp256k1')

const ECIES_SESSION_KEY_LEN = 129
const TAG = 'CommentEncryption'

export interface EncryptionStatus {
  encrypted: boolean
  comment: string
}

/**
 * Encrypts a buffer to two recipients. Throws on error.
 *
 * @param {Buffer} data Data to encrypt
 * @param {Buffer} pubKeyRecipient Public key of the recipient. Uncompressed without leading 0x04.
 * @param {Buffer} pubKeySelf Public key of the sender. Uncompressed without leading 0x04.
 * @returns {Buffer} Encrypted data to sender and recipient.
 */
export function encryptData(data: Buffer, pubKeyRecipient: Buffer, pubKeySelf: Buffer): Buffer {
  const sessionKey: Buffer = randomBytes(16)
  const sessionKeyToSelf: Buffer = ECIESEncrypt(pubKeySelf, sessionKey)
  const sessionKeyToOther: Buffer = ECIESEncrypt(pubKeyRecipient, sessionKey)
  const ciphertext = AES128EncryptAndHMAC(sessionKey, sessionKey, data)

  return Buffer.concat([sessionKeyToOther, sessionKeyToSelf, ciphertext])
}

/**
 * Decrypts raw data that was encrypted by encryptData. Throws on error.
 *
 * @param {Buffer} data Data to decrypt.
 * @param {Buffer} key Private key to decrypt the message with.
 * @param {boolean} sender If the decryptor is the sender of the message.
 * @returns {Buffer} Decrypted data.
 */

export function decryptData(data: Buffer, key: Buffer, sender: boolean): Buffer {
  // Deal with presumably enencrypted comments
  if (data.length < ECIES_SESSION_KEY_LEN * 2 + 48) {
    throw new Error('Buffer length too short')
  }
  const sessionKeyEncrypted = sender
    ? data.slice(ECIES_SESSION_KEY_LEN, ECIES_SESSION_KEY_LEN * 2)
    : data.slice(0, ECIES_SESSION_KEY_LEN)
  const sessionKey = ECIESDecrypt(key, sessionKeyEncrypted)

  const encryptedMessage = data.slice(ECIES_SESSION_KEY_LEN * 2)
  return AES128DecryptAndHMAC(sessionKey, sessionKey, encryptedMessage)
}

/**
 * Encrypts a comment. If it can encrypt, it returns a base64 string with the following:
 *    ECIES(session key to other) + ECIES(session key to self) + AES(comment)
 * If it fails to encrypt, it returns the comment without any changes.
 *
 * @param {string} comment Comment to encrypt.
 * @param {Buffer} pubKeyRecipient Public key of the recipient. May be compressed.
 * @param {Buffer} pubKeySelf Public key of the sender. May be compressed.
 * @returns {string} base64 string of encrypted comment if can encrypt, otherwise comment.
 */
export function encryptComment(
  comment: string,
  pubKeyRecipient: Buffer,
  pubKeySelf: Buffer
): EncryptionStatus {
  try {
    // Uncompress public keys & strip out the leading 0x04
    const pubRecip = decompressPublicKey(pubKeyRecipient)
    const pubSelf = decompressPublicKey(pubKeySelf)
    const data = encryptData(Buffer.from(comment, 'ucs2'), pubRecip, pubSelf).toString('base64')
    return {
      encrypted: true,
      comment: data,
    }
  } catch (e) {
    console.info(`${TAG}/Error encrypting comment: ${e}`)
    return { encrypted: false, comment }
  }
}

/**
 * Decrypts a comments encrypted by encryptComment. If it cannot decrypt the comment (i.e. comment was
 * never encrypted in the first place), it returns the comments without any changes.
 *
 * @param {string} comment Comment to decrypt. If encrypted, base64 encoded. May be plaintext.
 * @param {Buffer} key Private key to decrypt the message with.
 * @param {boolean} sender If the decryptor is the sender of the message.
 * @returns {string} Decrypted comment if can decrypt, otherwise comment.
 */

export const decryptComment = memoize(
  (comment: string, key: Buffer, sender: boolean): EncryptionStatus => {
    try {
      const buf = Buffer.from(comment, 'base64')
      const data = decryptData(buf, key, sender).toString('ucs2')
      return { encrypted: true, comment: data }
    } catch (error) {
      console.info(`${TAG}/Could not decrypt: ${error.message}`)
      return { encrypted: false, comment }
    }
  }
)

/**
 * Turns a private key to a compressed public key (hex string with hex leader).
 *
 * @param {Buffer} privateKey Private key.
 * @returns {string} Corresponding compessed public key in hex encoding with '0x' leader.
 */
export function compressedPubKey(privateKey: Buffer): string {
  const key = ec.keyFromPrivate(privateKey)
  return '0x' + key.getPublic(true, 'hex')
}

/**
 * Decompresses a public key and strips out the '0x04' leading constant. This makes
 * any public key suitable to be used with this ECIES implementation.
 *
 * @param publicKey Public key in standard form (with 0x02, 0x03, or 0x04 prefix)
 * @returns Decompresssed public key without prefix.
 */
export function decompressPublicKey(publicKey: Buffer): Buffer {
  return Buffer.from(ec.keyFromPublic(publicKey).getPublic(false, 'hex'), 'hex').slice(1)
}

/**
 * Derives a private comment encryption key from seed private key
 *
 * @param {string} privateKey Hex encoded private account key.
 * @returns {Buffer} Comment Encryption Private key.
 */
export function deriveCEK(privateKey: string): Buffer {
  const buf = Buffer.from(privateKey, 'hex')
  return hkdf(buf, 32, { hash: 'sha-256' })
}

export const commentEncryption = {
  encryptComment,
  decryptComment,
  compressedPubKey,
  deriveCEK,
}
