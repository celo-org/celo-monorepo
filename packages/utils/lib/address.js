"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/base/lib/address");
var ethereumjs_util_1 = require("ethereumjs-util");
var Web3Utils = __importStar(require("web3-utils"));
var ecdh_1 = require("./ecdh");
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
var address_2 = require("@celo/base/lib/address");
exports.bufferToHex = address_2.bufferToHex;
exports.ensureLeading0x = address_2.ensureLeading0x;
exports.eqAddress = address_2.eqAddress;
exports.findAddressIndex = address_2.findAddressIndex;
exports.getAddressChunks = address_2.getAddressChunks;
exports.hexToBuffer = address_2.hexToBuffer;
exports.isHexString = address_2.isHexString;
exports.mapAddressListDataOnto = address_2.mapAddressListDataOnto;
exports.mapAddressListOnto = address_2.mapAddressListOnto;
exports.normalizeAddress = address_2.normalizeAddress;
exports.normalizeAddressWith0x = address_2.normalizeAddressWith0x;
exports.NULL_ADDRESS = address_2.NULL_ADDRESS;
exports.trimLeading0x = address_2.trimLeading0x;
var ethereumjs_util_2 = require("ethereumjs-util");
exports.isValidChecksumAddress = ethereumjs_util_2.isValidChecksumAddress;
exports.toChecksumAddress = ethereumjs_util_2.toChecksumAddress;
exports.privateKeyToAddress = function (privateKey) {
    return ethereumjs_util_1.toChecksumAddress(address_1.ensureLeading0x(ethereumjs_util_1.privateToAddress(address_1.hexToBuffer(privateKey)).toString('hex')));
};
exports.privateKeyToPublicKey = function (privateKey) {
    return ethereumjs_util_1.toChecksumAddress(address_1.ensureLeading0x(ethereumjs_util_1.privateToPublic(address_1.hexToBuffer(privateKey)).toString('hex')));
};
exports.publicKeyToAddress = function (publicKey) {
    return ethereumjs_util_1.toChecksumAddress(address_1.ensureLeading0x(ethereumjs_util_1.pubToAddress(address_1.hexToBuffer(publicKey), ecdh_1.isCompressed(publicKey)).toString('hex')));
};
exports.isValidPrivateKey = function (privateKey) {
    return privateKey.startsWith('0x') && ethereumjs_util_1.isValidPrivate(address_1.hexToBuffer(privateKey));
};
exports.isValidAddress = function (input) { return Web3Utils.isAddress(input); };
//# sourceMappingURL=address.js.map