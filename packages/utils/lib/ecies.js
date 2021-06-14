/**
 * ECIES encrypt/decrypt with Ethereum keys
 * A Typescript implementation of geth/crypto/ecies/ecies.go
 * Modified from https://github.com/LimelabsTech/eth-ecies/blob/master/index.js
 * At commit c858cbd021e9a99d8afa629de33c8c30d923b3e5.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var elliptic_1 = require("elliptic");
var ec = new elliptic_1.ec('secp256k1');
/**
 * Increments big endian uint32
 *
 * @param {Buffer} ctr 32 bit unsigned big endian integer to increment.
 * @returns Incremented counter.
 */
var IncCounter = function (ctr) {
    for (var i = ctr.length - 1; i >= 0; i--) {
        ctr[i]++;
        if (ctr[i] !== 0) {
            return ctr;
        }
    }
    return ctr;
};
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
var ConcatKDF = function (px, kdLen) {
    var blockSize = 32;
    var reps = ((kdLen + 7) * 8) / (blockSize * 8);
    var counter = Buffer.from('00000001', 'hex');
    var k = Buffer.from('00', 'hex');
    for (var i = 0; i <= reps; i++) {
        var hash = crypto_1.createHash('sha256');
        hash.update(counter);
        hash.update(px);
        k = Buffer.concat([k, hash.digest()]);
        counter = IncCounter(counter);
    }
    return k.slice(1, kdLen + 1);
};
/**
 * AES-128 CTR encrypt with message authentication
 * @param {Buffer} encryptionKey
 * @param {Buffer} macKey
 * @param {Buffer} plaintext
 * @returns {Buffer} ciphertext
 */
function AES128EncryptAndHMAC(encryptionKey, macKey, plaintext) {
    var iv = crypto_1.randomBytes(16);
    var cipher = crypto_1.createCipheriv('aes-128-ctr', encryptionKey, iv);
    var firstChunk = cipher.update(plaintext);
    var secondChunk = cipher.final();
    var dataToMac = Buffer.concat([iv, firstChunk, secondChunk]);
    var mac = crypto_1.createHmac('sha256', macKey)
        .update(dataToMac)
        .digest();
    return Buffer.concat([dataToMac, mac]);
}
exports.AES128EncryptAndHMAC = AES128EncryptAndHMAC;
/**
 * AES-128 CTR decrypt with message authentication
 * @param {Buffer} encryptionKey
 * @param {Buffer} macKey
 * @param {Buffer} ciphertext
 * @returns {Buffer} plaintext
 */
function AES128DecryptAndHMAC(encryptionKey, macKey, ciphertext) {
    var iv = ciphertext.slice(0, 16);
    var message = ciphertext.slice(16, ciphertext.length - 32);
    var mac = ciphertext.slice(ciphertext.length - 32, ciphertext.length);
    var dataToMac = Buffer.concat([iv, message]);
    var computedMac = crypto_1.createHmac('sha256', macKey)
        .update(dataToMac)
        .digest();
    if (!mac.equals(computedMac)) {
        throw new Error('MAC mismatch');
    }
    var cipher = crypto_1.createDecipheriv('aes-128-ctr', encryptionKey, iv);
    var firstChunk = cipher.update(message);
    var secondChunk = cipher.final();
    return Buffer.concat([firstChunk, secondChunk]);
}
exports.AES128DecryptAndHMAC = AES128DecryptAndHMAC;
/**
 * ECIES encrypt
 * @param {Buffer} pubKeyTo Ethereum pub key, 64 bytes.
 * @param {Buffer} plaintext Plaintext to be encrypted.
 * @returns {Buffer} Encrypted message, serialized, 113+ bytes
 */
function Encrypt(pubKeyTo, plaintext) {
    var ephemPrivKey = ec.keyFromPrivate(crypto_1.randomBytes(32));
    var ephemPubKey = ephemPrivKey.getPublic(false, 'hex');
    var ephemPubKeyEncoded = Buffer.from(ephemPubKey, 'hex');
    var px = ephemPrivKey.derive(ec.keyFromPublic(Buffer.concat([Buffer.from([0x04]), pubKeyTo])).getPublic());
    var hash = ConcatKDF(px.toBuffer(), 32);
    var encryptionKey = hash.slice(0, 16);
    var macKey = crypto_1.createHash('sha256')
        .update(hash.slice(16))
        .digest();
    var message = AES128EncryptAndHMAC(encryptionKey, macKey, plaintext);
    var serializedCiphertext = Buffer.concat([
        ephemPubKeyEncoded,
        message,
    ]);
    return serializedCiphertext;
}
exports.Encrypt = Encrypt;
/**
 * ECIES decrypt
 * @param {Buffer} privKey Ethereum private key, 32 bytes.
 * @param {Buffer} encrypted Encrypted message, serialized, 113+ bytes
 * @returns {Buffer} plaintext
 */
function Decrypt(privKey, encrypted) {
    // Read iv, ephemPubKey, mac, ciphertext from encrypted message
    var ephemPubKeyEncoded = encrypted.slice(0, 65);
    var symmetricEncrypted = encrypted.slice(65);
    var ephemPubKey = ec.keyFromPublic(ephemPubKeyEncoded).getPublic();
    var px = ec.keyFromPrivate(privKey).derive(ephemPubKey);
    var hash = ConcatKDF(px.toBuffer(), 32);
    // km, ke
    var encryptionKey = hash.slice(0, 16);
    var macKey = crypto_1.createHash('sha256')
        .update(hash.slice(16))
        .digest();
    return AES128DecryptAndHMAC(encryptionKey, macKey, symmetricEncrypted);
}
exports.Decrypt = Decrypt;
exports.ECIES = {
    Encrypt: Encrypt,
    Decrypt: Decrypt,
    AES128EncryptAndHMAC: AES128EncryptAndHMAC,
    AES128DecryptAndHMAC: AES128DecryptAndHMAC,
};
//# sourceMappingURL=ecies.js.map