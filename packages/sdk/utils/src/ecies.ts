/**
 * ECIES encrypt/decrypt with Ethereum keys
 * A Typescript implementation of geth/crypto/ecies/ecies.go
 * Modified from https://github.com/LimelabsTech/eth-ecies/blob/master/index.js
 * At commit c858cbd021e9a99d8afa629de33c8c30d923b3e5.
 */
'use strict'

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'crypto'

export const IV_LENGTH = 16

/**
 * Increments big endian uint32
 *
 * @param {Buffer} ctr 32 bit unsigned big endian integer to increment.
 * @returns Incremented counter.
 */
const IncCounter = (ctr: Buffer) => {
  for (let i = ctr.length - 1; i >= 0; i--) {
    ctr[i]++
    if (ctr[i] !== 0) {
      return ctr
    }
  }
  return ctr
}

/**
 * NIST 8000-56C Rev 1 One Step KDF with the following parameters:
 * - H(x) is SHA-256(x)
 * - Fixed info is null
 *
 * TODO:
 * - Implement proper ceiling on reps.
 *
 * @param {Buffer} px Input keying material to derive key from.
 * @param {number} kdLen Length of output in bytes
 * @returns {Buffer} Output keying material of length kdLen bytes.
 */
const ConcatKDF = (px: Buffer, kdLen: number) => {
  const blockSize = 32
  const reps = ((kdLen + 7) * 8) / (blockSize * 8)
  let counter = Buffer.from('00000001', 'hex')
  let k = Buffer.from('00', 'hex')
  for (let i = 0; i <= reps; i++) {
    const hash = createHash('sha256')
    hash.update(counter)
    hash.update(px)
    k = Buffer.concat([k, hash.digest()])
    counter = IncCounter(counter)
  }
  return k.slice(1, kdLen + 1)
}

/**
 * AES-128 CTR encrypt
 * @param {Buffer} encryptionKey
 * @param {Buffer} iv
 * @param {Buffer} plaintext
 * @returns {Buffer} ciphertext
 */
export function AES128Encrypt(encryptionKey: Buffer, iv: Buffer, plaintext: Buffer) {
  const cipher = createCipheriv('aes-128-ctr', encryptionKey, iv)
  const firstChunk = cipher.update(plaintext)
  const secondChunk = cipher.final()
  return Buffer.concat([iv, firstChunk, secondChunk])
}

/**
 * AES-128 CTR encrypt with message authentication
 * @param {Buffer} encryptionKey
 * @param {Buffer} macKey
 * @param {Buffer} plaintext
 * @returns {Buffer} ciphertext
 */
export function AES128EncryptAndHMAC(
  encryptionKey: Buffer,
  macKey: Buffer,
  plaintext: Buffer
): Buffer {
  const iv = randomBytes(IV_LENGTH)
  const dataToMac = AES128Encrypt(encryptionKey, iv, plaintext)
  const mac = createHmac('sha256', macKey).update(dataToMac).digest()

  return Buffer.concat([dataToMac, mac])
}

/**
 * AES-128 CTR decrypt
 * @param {Buffer} encryptionKey
 * @param {Buffer} iv
 * @param {Buffer} ciphertext
 * @returns {Buffer} plaintext
 */
export function AES128Decrypt(encryptionKey: Buffer, iv: Buffer, ciphertext: Buffer) {
  const cipher = createDecipheriv('aes-128-ctr', encryptionKey, iv)
  const firstChunk = cipher.update(ciphertext)
  const secondChunk = cipher.final()

  return Buffer.concat([firstChunk, secondChunk])
}

/**
 * AES-128 CTR decrypt with message authentication
 * @param {Buffer} encryptionKey
 * @param {Buffer} macKey
 * @param {Buffer} ciphertext
 * @returns {Buffer} plaintext
 */
export function AES128DecryptAndHMAC(
  encryptionKey: Buffer,
  macKey: Buffer,
  ciphertext: Buffer
): Buffer {
  const iv = ciphertext.slice(0, IV_LENGTH)
  const message = ciphertext.slice(IV_LENGTH, ciphertext.length - 32)
  const mac = ciphertext.slice(ciphertext.length - 32, ciphertext.length)
  const dataToMac = Buffer.concat([iv, message])
  const computedMac = createHmac('sha256', macKey).update(dataToMac).digest()
  if (!mac.equals(computedMac)) {
    throw new Error('MAC mismatch')
  }

  return AES128Decrypt(encryptionKey, iv, message)
}

/**
 * ECIES encrypt
 * @param {Buffer} pubKeyTo Ethereum pub key, 64 bytes.
 * @param {Buffer} plaintext Plaintext to be encrypted.
 * @returns {Buffer} Encrypted message, serialized, 113+ bytes
 */
export function Encrypt(pubKeyTo: Buffer, plaintext: Buffer) {
  // NOTE: elliptic is disabled elsewhere in this library to prevent
  // accidental signing of truncated messages.
  // tslint:disable-next-line:import-blacklist
  const EC = require('elliptic').ec
  const ec = new EC('secp256k1')
  const ephemPrivKey = ec.keyFromPrivate(randomBytes(32))
  const ephemPubKey = ephemPrivKey.getPublic(false, 'hex')
  const ephemPubKeyEncoded = Buffer.from(ephemPubKey, 'hex')
  const px = ephemPrivKey.derive(
    ec.keyFromPublic(Buffer.concat([Buffer.from([0x04]), pubKeyTo])).getPublic()
  )
  const hash = ConcatKDF(px.toArrayLike(Buffer), 32)
  const encryptionKey = hash.slice(0, 16)
  const macKey = createHash('sha256').update(hash.slice(16)).digest()
  const message = AES128EncryptAndHMAC(encryptionKey, macKey, plaintext)
  const serializedCiphertext = Buffer.concat([
    ephemPubKeyEncoded, // 65 bytes
    message, // iv + ciphertext + mac (min 48 bytes)
  ])
  return serializedCiphertext
}

/**
 * ECIES decrypt
 * @param {Buffer} privKey Ethereum private key, 32 bytes.
 * @param {Buffer} encrypted Encrypted message, serialized, 113+ bytes
 * @returns {Buffer} plaintext
 */
export function Decrypt(privKey: Buffer, encrypted: Buffer) {
  // Read iv, ephemPubKey, mac, ciphertext from encrypted message
  const ephemPubKeyEncoded = encrypted.slice(0, 65)
  const symmetricEncrypted = encrypted.slice(65)

  // NOTE: elliptic is disabled elsewhere in this library to prevent
  // accidental signing of truncated messages.
  // tslint:disable-next-line:import-blacklist
  const EC = require('elliptic').ec
  const ec = new EC('secp256k1')

  const ephemPubKey = ec.keyFromPublic(ephemPubKeyEncoded).getPublic()
  const px = ec.keyFromPrivate(privKey).derive(ephemPubKey)
  const hash = ConcatKDF(px.toBuffer(), 32)
  // km, ke
  const encryptionKey = hash.slice(0, 16)
  const macKey = createHash('sha256').update(hash.slice(16)).digest()

  return AES128DecryptAndHMAC(encryptionKey, macKey, symmetricEncrypted)
}

export const ECIES = {
  Encrypt,
  Decrypt,
  AES128EncryptAndHMAC,
  AES128DecryptAndHMAC,
}
