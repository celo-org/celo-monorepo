"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var ethereumjs_util_1 = require("ethereumjs-util");
var rlp = __importStar(require("rlp"));
// This file contains utilities that help with istanbul-specific block information.
// See https://github.com/celo-org/celo-blockchain/blob/master/core/types/istanbul.go
var ISTANBUL_EXTRA_VANITY_BYTES = 32;
function bigNumberFromBuffer(data) {
    return new bignumber_js_1.default('0x' + (data.toString('hex') || '0'), 16);
}
function sealFromBuffers(data) {
    return {
        bitmap: bigNumberFromBuffer(data[0]),
        signature: '0x' + data[1].toString('hex'),
        round: bigNumberFromBuffer(data[2]),
    };
}
// Parse RLP encoded block extra data into an IstanbulExtra object.
function parseBlockExtraData(data) {
    var buffer = Buffer.from(data.replace(/^0x/, ''), 'hex');
    var decode = rlp.decode('0x' + buffer.slice(ISTANBUL_EXTRA_VANITY_BYTES).toString('hex'));
    return {
        addedValidators: decode[0].map(function (addr) { return ethereumjs_util_1.toChecksumAddress(addr.toString('hex')); }),
        addedValidatorsPublicKeys: decode[1].map(function (key) { return '0x' + key.toString('hex'); }),
        removedValidators: bigNumberFromBuffer(decode[2]),
        seal: '0x' + decode[3].toString('hex'),
        aggregatedSeal: sealFromBuffers(decode[4]),
        parentAggregatedSeal: sealFromBuffers(decode[5]),
    };
}
exports.parseBlockExtraData = parseBlockExtraData;
function bitIsSet(bitmap, index) {
    if (index < 0) {
        throw new Error("bit index must be greater than zero: got " + index);
    }
    return bitmap
        .idiv('1' + '0'.repeat(index), 2)
        .mod(2)
        .gt(0);
}
exports.bitIsSet = bitIsSet;
exports.IstanbulUtils = {
    parseBlockExtraData: parseBlockExtraData,
    bitIsSet: bitIsSet,
};
//# sourceMappingURL=istanbul.js.map