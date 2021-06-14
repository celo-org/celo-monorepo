"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ethereumjs_util_1 = require("ethereumjs-util");
var Web3Utils = __importStar(require("web3-utils"));
var HEX_REGEX = /^0x[0-9A-F]*$/i;
exports.eqAddress = function (a, b) { return exports.normalizeAddress(a) === exports.normalizeAddress(b); };
exports.normalizeAddress = function (a) { return exports.trimLeading0x(a).toLowerCase(); };
exports.normalizeAddressWith0x = function (a) { return exports.ensureLeading0x(a).toLowerCase(); };
exports.trimLeading0x = function (input) { return (input.startsWith('0x') ? input.slice(2) : input); };
exports.ensureLeading0x = function (input) { return (input.startsWith('0x') ? input : "0x" + input); };
// Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
// into ['ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10','ce10']
exports.getAddressChunks = function (input) {
    return exports.trimLeading0x(input).match(/.{1,4}/g) || [];
};
exports.isHexString = function (input) { return HEX_REGEX.test(input); };
exports.hexToBuffer = function (input) { return Buffer.from(exports.trimLeading0x(input), 'hex'); };
exports.bufferToHex = function (buf) { return exports.ensureLeading0x(buf.toString('hex')); };
exports.privateKeyToAddress = function (privateKey) {
    return ethereumjs_util_1.toChecksumAddress(exports.ensureLeading0x(ethereumjs_util_1.privateToAddress(exports.hexToBuffer(privateKey)).toString('hex')));
};
exports.privateKeyToPublicKey = function (privateKey) {
    return ethereumjs_util_1.toChecksumAddress(exports.ensureLeading0x(ethereumjs_util_1.privateToPublic(exports.hexToBuffer(privateKey)).toString('hex')));
};
exports.publicKeyToAddress = function (publicKey) {
    return ethereumjs_util_1.toChecksumAddress(exports.ensureLeading0x(ethereumjs_util_1.pubToAddress(exports.hexToBuffer(publicKey)).toString('hex')));
};
exports.isValidPrivateKey = function (privateKey) {
    return privateKey.startsWith('0x') && ethereumjs_util_1.isValidPrivate(exports.hexToBuffer(privateKey));
};
var ethereumjs_util_2 = require("ethereumjs-util");
exports.isValidChecksumAddress = ethereumjs_util_2.isValidChecksumAddress;
exports.toChecksumAddress = ethereumjs_util_2.toChecksumAddress;
exports.isValidAddress = function (input) { return Web3Utils.isAddress(input); };
exports.NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.findAddressIndex = function (address, addresses) {
    return addresses.findIndex(function (x) { return exports.eqAddress(x, address); });
};
// Returns an array of indices mapping the entries of oldAddress[] to newAddress[]
exports.mapAddressListOnto = function (oldAddress, newAddress) {
    var oldAddressIndex = oldAddress.map(function (x, index) { return ({ address: exports.normalizeAddress(x), index: index }); });
    var newAddressIndex = newAddress.map(function (x, index) { return ({ address: exports.normalizeAddress(x), index: index }); });
    oldAddressIndex.sort(function (a, b) { return a.address.localeCompare(b.address); });
    newAddressIndex.sort(function (a, b) { return a.address.localeCompare(b.address); });
    var res = __spreadArrays(Array(oldAddress.length).fill(-1));
    for (var i = 0, j = 0; i < oldAddress.length && j < newAddress.length;) {
        var cmp = oldAddressIndex[i].address.localeCompare(newAddressIndex[j].address);
        if (cmp < 0) {
            i++;
        }
        else if (cmp > 0) {
            j++;
        }
        else {
            // Address is present in both lists
            res[oldAddressIndex[i].index] = newAddressIndex[j].index;
            i++;
            j++;
        }
    }
    return res;
};
// Returns data[] reordered by mapAddressListOnto(), and initiaValue for any entry of
// oldAddress[] not present in newAddress[].
function mapAddressListDataOnto(data, oldAddress, newAddress, initialValue) {
    var res = __spreadArrays(Array(oldAddress.length).fill(initialValue));
    if (data.length === 0) {
        return res;
    }
    var addressIndexMap = exports.mapAddressListOnto(oldAddress, newAddress);
    for (var i = 0; i < addressIndexMap.length; i++) {
        if (addressIndexMap[i] >= 0) {
            res[addressIndexMap[i]] = data[i];
        }
    }
    return res;
}
exports.mapAddressListDataOnto = mapAddressListDataOnto;
//# sourceMappingURL=address.js.map