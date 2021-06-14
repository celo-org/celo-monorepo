/// <reference types="node" />
/**
 * AES-128 CTR encrypt with message authentication
 * @param {Buffer} encryptionKey
 * @param {Buffer} macKey
 * @param {Buffer} plaintext
 * @returns {Buffer} ciphertext
 */
export declare function AES128EncryptAndHMAC(encryptionKey: Buffer, macKey: Buffer, plaintext: Buffer): Buffer;
/**
 * AES-128 CTR decrypt with message authentication
 * @param {Buffer} encryptionKey
 * @param {Buffer} macKey
 * @param {Buffer} ciphertext
 * @returns {Buffer} plaintext
 */
export declare function AES128DecryptAndHMAC(encryptionKey: Buffer, macKey: Buffer, ciphertext: Buffer): Buffer;
/**
 * ECIES encrypt
 * @param {Buffer} pubKeyTo Ethereum pub key, 64 bytes.
 * @param {Buffer} plaintext Plaintext to be encrypted.
 * @returns {Buffer} Encrypted message, serialized, 113+ bytes
 */
export declare function Encrypt(pubKeyTo: Buffer, plaintext: Buffer): Buffer;
/**
 * ECIES decrypt
 * @param {Buffer} privKey Ethereum private key, 32 bytes.
 * @param {Buffer} encrypted Encrypted message, serialized, 113+ bytes
 * @returns {Buffer} plaintext
 */
export declare function Decrypt(privKey: Buffer, encrypted: Buffer): Buffer;
export declare const ECIES: {
    Encrypt: typeof Encrypt;
    Decrypt: typeof Decrypt;
    AES128EncryptAndHMAC: typeof AES128EncryptAndHMAC;
    AES128DecryptAndHMAC: typeof AES128DecryptAndHMAC;
};
