"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/base/lib/address");
var crypto_1 = require("crypto");
var elliptic_1 = require("elliptic");
var secp256k1 = new elliptic_1.ec('secp256k1');
function computeSharedSecret(privateKey, publicKey) {
    var ecdh = crypto_1.createECDH('secp256k1');
    ecdh.setPrivateKey(Buffer.from(address_1.trimLeading0x(privateKey), 'hex'));
    return ecdh.computeSecret(Buffer.from(ensureCompressed(publicKey), 'hex'));
}
exports.computeSharedSecret = computeSharedSecret;
function isCompressed(publicKey) {
    var noLeading0x = address_1.trimLeading0x(publicKey);
    if (noLeading0x.length === 64) {
        return true;
    }
    return noLeading0x.length === 66 && (noLeading0x.startsWith('02') || noLeading0x.startsWith('03'));
}
exports.isCompressed = isCompressed;
function ensureCompressed(publicKey) {
    return secp256k1.keyFromPublic(ensureUncompressedPrefix(publicKey), 'hex').getPublic(true, 'hex');
}
exports.ensureCompressed = ensureCompressed;
function ensureUncompressed(publicKey) {
    var noLeading0x = address_1.trimLeading0x(publicKey);
    var uncompressed = secp256k1
        .keyFromPublic(ensureUncompressedPrefix(noLeading0x), 'hex')
        .getPublic(false, 'hex');
    return uncompressed;
}
exports.ensureUncompressed = ensureUncompressed;
function trimUncompressedPrefix(publicKey) {
    var noLeading0x = address_1.trimLeading0x(publicKey);
    if (noLeading0x.length === 130 && noLeading0x.startsWith('04')) {
        return noLeading0x.slice(2);
    }
    return noLeading0x;
}
exports.trimUncompressedPrefix = trimUncompressedPrefix;
function ensureUncompressedPrefix(publicKey) {
    var noLeading0x = address_1.trimLeading0x(publicKey);
    if (noLeading0x.length === 128) {
        return "04" + noLeading0x;
    }
    return noLeading0x;
}
//# sourceMappingURL=ecdh.js.map