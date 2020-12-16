"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var elliptic_1 = require("elliptic");
var account_1 = require("./account");
var address_1 = require("./address");
var ec = new elliptic_1.ec('secp256k1');
/**
 * Turns a private key to a compressed public key (hex string with hex leader).
 *
 * @param {Buffer} privateKey Private key.
 * @returns {string} Corresponding compessed public key in hex encoding with '0x' leader.
 */
function compressedPubKey(privateKey) {
    var key = ec.keyFromPrivate(privateKey);
    return address_1.ensureLeading0x(key.getPublic(true, 'hex'));
}
exports.compressedPubKey = compressedPubKey;
/**
 * Decompresses a public key and strips out the '0x04' leading constant. This makes
 * any public key suitable to be used with this ECIES implementation.
 *
 * @param publicKey Public key in standard form (with 0x02, 0x03, or 0x04 prefix)
 * @returns Decompresssed public key without prefix.
 */
function decompressPublicKey(publicKey) {
    return Buffer.from(ec.keyFromPublic(publicKey).getPublic(false, 'hex'), 'hex').slice(1);
}
exports.decompressPublicKey = decompressPublicKey;
/**
 * Derives a data encryption key from the mnemonic
 *
 * @param {string} privateKey Hex encoded private account key.
 * @returns {Buffer} Comment Encryption Private key.
 */
function deriveDek(mnemonic, bip39ToUse) {
    if (!mnemonic) {
        throw new Error('Invalid mnemonic');
    }
    return account_1.generateKeys(mnemonic, undefined, 1, // The DEK is derived from change index 1, not 0 like the wallet's transaction keys
    0, bip39ToUse);
}
exports.deriveDek = deriveDek;
exports.DataEncryptionKeyUtils = {
    compressedPubKey: compressedPubKey,
    decompressPublicKey: decompressPublicKey,
    deriveDek: deriveDek,
};
//# sourceMappingURL=dataEncryptionKey.js.map