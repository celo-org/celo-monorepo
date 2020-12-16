"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var dataEncryptionKey_1 = require("./dataEncryptionKey");
var ecies_1 = require("./ecies");
var ECIES_SESSION_KEY_LEN = 129;
var MIN_COMMENT_KEY_LENGTH = 33;
var TAG = 'CommentEncryption';
/**
 * Encrypts a buffer to two recipients. Throws on error.
 *
 * @param {Buffer} data Data to encrypt
 * @param {Buffer} pubKeyRecipient Public key of the recipient. Uncompressed without leading 0x04.
 * @param {Buffer} pubKeySelf Public key of the sender. Uncompressed without leading 0x04.
 * @returns {Buffer} Encrypted data to sender and recipient.
 */
function encryptData(data, pubKeyRecipient, pubKeySelf) {
    var sessionKey = crypto_1.randomBytes(16);
    var sessionKeyToSelf = ecies_1.Encrypt(pubKeySelf, sessionKey);
    var sessionKeyToOther = ecies_1.Encrypt(pubKeyRecipient, sessionKey);
    var ciphertext = ecies_1.AES128EncryptAndHMAC(sessionKey, sessionKey, data);
    return Buffer.concat([sessionKeyToOther, sessionKeyToSelf, ciphertext]);
}
exports.encryptData = encryptData;
/**
 * Decrypts raw data that was encrypted by encryptData. Throws on error.
 *
 * @param {Buffer} data Data to decrypt.
 * @param {Buffer} key Private key to decrypt the message with.
 * @param {boolean} sender If the decryptor is the sender of the message.
 * @returns {Buffer} Decrypted data.
 */
function decryptData(data, key, sender) {
    // Deal with presumably enencrypted comments
    if (data.length < ECIES_SESSION_KEY_LEN * 2 + 48) {
        throw new Error('Buffer length too short');
    }
    var sessionKeyEncrypted = sender
        ? data.slice(ECIES_SESSION_KEY_LEN, ECIES_SESSION_KEY_LEN * 2)
        : data.slice(0, ECIES_SESSION_KEY_LEN);
    var sessionKey = ecies_1.Decrypt(key, sessionKeyEncrypted);
    var encryptedMessage = data.slice(ECIES_SESSION_KEY_LEN * 2);
    return ecies_1.AES128DecryptAndHMAC(sessionKey, sessionKey, encryptedMessage);
}
exports.decryptData = decryptData;
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
function encryptComment(comment, pubKeyRecipient, pubKeySelf) {
    try {
        if (pubKeyRecipient.length < MIN_COMMENT_KEY_LENGTH ||
            pubKeySelf.length < MIN_COMMENT_KEY_LENGTH) {
            throw new Error('Comment key too short');
        }
        // Uncompress public keys & strip out the leading 0x04
        var pubRecip = dataEncryptionKey_1.decompressPublicKey(pubKeyRecipient);
        var pubSelf = dataEncryptionKey_1.decompressPublicKey(pubKeySelf);
        var data = encryptData(Buffer.from(comment, 'ucs2'), pubRecip, pubSelf).toString('base64');
        return {
            success: true,
            comment: data,
        };
    }
    catch (e) {
        console.info(TAG + "/Error encrypting comment: " + e);
        return { success: false, comment: comment };
    }
}
exports.encryptComment = encryptComment;
/**
 * Decrypts a comments encrypted by encryptComment. If it cannot decrypt the comment (i.e. comment was
 * never encrypted in the first place), it returns the comments without any changes.
 *
 * @param {string} comment Comment to decrypt. If encrypted, base64 encoded. May be plaintext.
 * @param {Buffer} key Private key to decrypt the message with.
 * @param {boolean} sender If the decryptor is the sender of the message.
 * @returns {string} Decrypted comment if can decrypt, otherwise comment.
 */
function decryptComment(comment, key, sender) {
    try {
        var buf = Buffer.from(comment, 'base64');
        var data = decryptData(buf, key, sender).toString('ucs2');
        return { success: true, comment: data };
    }
    catch (error) {
        console.info(TAG + "/Could not decrypt: " + error.message);
        return { success: false, comment: comment };
    }
}
exports.decryptComment = decryptComment;
exports.CommentEncryptionUtils = {
    encryptComment: encryptComment,
    decryptComment: decryptComment,
};
//# sourceMappingURL=commentEncryption.js.map