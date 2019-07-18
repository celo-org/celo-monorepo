import { ECIES } from '../src/ecies'

const crypto = require('crypto')
const eutil = require('ethereumjs-util')

describe('ECIES', () => {
  describe('encrypt', () => {
    it('should encrypt a message without error', () => {
      const privKey = crypto.randomBytes(32)
      const pubKey = eutil.privateToPublic(privKey)
      const message = new Buffer(`foo`)
      const encrypted = ECIES.Encrypt(pubKey, message)
      expect(encrypted.length).toBeGreaterThanOrEqual(113)
    })

    it('should throw an error if priv key is given', () => {
      const privKey = crypto.randomBytes(32)
      const message = new Buffer('foo')
      try {
        ECIES.Encrypt(privKey, message)
        expect(false).toBe(true)
      } catch (error) {
        // ok, encryption should not work when a priv key is given
      }
    })
  })

  describe('roundtrip', () => {
    it('should return the same plaintext after roundtrip', () => {
      const plaintext = new Buffer('spam')
      const privKey = crypto.randomBytes(32)
      const pubKey = eutil.privateToPublic(privKey)
      const encrypted = ECIES.Encrypt(pubKey, plaintext)
      const decrypted = ECIES.Decrypt(privKey, encrypted)
      expect(decrypted.toString()).toEqual(plaintext.toString())
    })

    it('should only decrypt if correct priv key is given', () => {
      const plaintext = new Buffer('spam')
      const privKey = crypto.randomBytes(32)
      const pubKey = eutil.privateToPublic(privKey)
      const fakePrivKey = crypto.randomBytes(32)
      try {
        ECIES.Encrypt(pubKey, plaintext)
        ECIES.Decrypt(fakePrivKey, plaintext)
        expect(false).toBe(true)
      } catch (error) {
        // ok, decryption should not work for incorrect priv key
      }
    })

    it('should be able to encrypt and decrypt a longer message (1024 bytes)', () => {
      const plaintext = crypto.randomBytes(1024)
      const privKey = crypto.randomBytes(32)
      const pubKey = eutil.privateToPublic(privKey)
      const encrypted = ECIES.Encrypt(pubKey, plaintext)
      const decrypted = ECIES.Decrypt(privKey, encrypted)
      expect(decrypted.toString()).toEqual(plaintext.toString())
    })
  })
})

describe('AES128CTR', () => {
  describe('encrypt', () => {
    it('should encrypt a message without error', () => {
      const plaintext = new Buffer('spam')
      const encKey = crypto.randomBytes(16)
      const macKey = crypto.randomBytes(16)
      const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
      expect(encrypted.length).toBeGreaterThanOrEqual(plaintext.length)
    })
  })

  describe('roundtrip', () => {
    it('should return the same plaintext after roundtrip', () => {
      const plaintext = new Buffer('spam')
      const encKey = crypto.randomBytes(16)
      const macKey = crypto.randomBytes(16)
      const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
      const decrypted = ECIES.AES128DecryptAndHMAC(encKey, macKey, encrypted)
      expect(decrypted.toString()).toEqual(plaintext.toString())
    })

    it('should only decrypt if correct priv key is given', () => {
      const plaintext = new Buffer('spam')
      const encKey = crypto.randomBytes(16)
      const macKey = crypto.randomBytes(16)
      const fakeKey = crypto.randomBytes(16)
      const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
      console.info(encrypted.toString('hex').length)
      const decrypted = ECIES.AES128DecryptAndHMAC(fakeKey, macKey, encrypted)
      expect(plaintext.equals(decrypted)).toBe(false)
    })

    it('should be able to encrypt and decrypt a longer message (1024 bytes)', () => {
      const plaintext = crypto.randomBytes(1024)
      const encKey = crypto.randomBytes(16)
      const macKey = crypto.randomBytes(16)
      const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
      const decrypted = ECIES.AES128DecryptAndHMAC(encKey, macKey, encrypted)
      expect(decrypted.toString()).toEqual(plaintext.toString())
    })
  })

  describe('authentication', () => {
    it('should reject invalid mac', () => {
      try {
        const plaintext = new Buffer('spam')
        const encKey = crypto.randomBytes(16)
        const macKey = crypto.randomBytes(16)
        const fakeKey = crypto.randomBytes(16)
        const encrypted = ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext)
        ECIES.AES128DecryptAndHMAC(encKey, fakeKey, encrypted)
        expect(true).toBe(false)
      } catch (e) {
        // Should in fact throw.
      }
    })
  })
})
