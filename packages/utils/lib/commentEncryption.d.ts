/// <reference types="node" />
export interface EncryptionStatus {
    success: boolean;
    comment: string;
}
/**
 * Encrypts a buffer to two recipients. Throws on error.
 *
 * @param {Buffer} data Data to encrypt
 * @param {Buffer} pubKeyRecipient Public key of the recipient. Uncompressed without leading 0x04.
 * @param {Buffer} pubKeySelf Public key of the sender. Uncompressed without leading 0x04.
 * @returns {Buffer} Encrypted data to sender and recipient.
 */
export declare function encryptData(data: Buffer, pubKeyRecipient: Buffer, pubKeySelf: Buffer): Buffer;
/**
 * Decrypts raw data that was encrypted by encryptData. Throws on error.
 *
 * @param {Buffer} data Data to decrypt.
 * @param {Buffer} key Private key to decrypt the message with.
 * @param {boolean} sender If the decryptor is the sender of the message.
 * @returns {Buffer} Decrypted data.
 */
export declare function decryptData(data: Buffer, key: Buffer, sender: boolean): Buffer;
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
export declare function encryptComment(comment: string, pubKeyRecipient: Buffer, pubKeySelf: Buffer): EncryptionStatus;
/**
 * Decrypts a comments encrypted by encryptComment. If it cannot decrypt the comment (i.e. comment was
 * never encrypted in the first place), it returns the comments without any changes.
 *
 * @param {string} comment Comment to decrypt. If encrypted, base64 encoded. May be plaintext.
 * @param {Buffer} key Private key to decrypt the message with.
 * @param {boolean} sender If the decryptor is the sender of the message.
 * @returns {string} Decrypted comment if can decrypt, otherwise comment.
 */
export declare function decryptComment(comment: string, key: Buffer, sender: boolean): EncryptionStatus;
/**
 * Turns a private key to a compressed public key (hex string with hex leader).
 *
 * @param {Buffer} privateKey Private key.
 * @returns {string} Corresponding compessed public key in hex encoding with '0x' leader.
 */
export declare function compressedPubKey(privateKey: Buffer): string;
/**
 * Decompresses a public key and strips out the '0x04' leading constant. This makes
 * any public key suitable to be used with this ECIES implementation.
 *
 * @param publicKey Public key in standard form (with 0x02, 0x03, or 0x04 prefix)
 * @returns Decompresssed public key without prefix.
 */
export declare function decompressPublicKey(publicKey: Buffer): Buffer;
/**
 * Derives a private comment encryption key from seed private key
 *
 * @param {string} privateKey Hex encoded private account key.
 * @returns {Buffer} Comment Encryption Private key.
 */
export declare function deriveCEK(privateKey: string): Buffer;
export declare const commentEncryption: {
    encryptComment: typeof encryptComment;
    decryptComment: typeof decryptComment;
    compressedPubKey: typeof compressedPubKey;
    deriveCEK: typeof deriveCEK;
};
