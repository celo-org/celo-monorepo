"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// this is an implementation of a subset of BLS12-377
var keccak256 = require('keccak256');
var BigInteger = require('bigi');
var reverse = require('buffer-reverse');
var bls12377js = __importStar(require("bls12377js"));
var address_1 = require("./address");
var n = BigInteger.fromHex('12ab655e9a2ca55660b44d1e5c37b00159aa76fed00000010a11800000000001', 16);
var MODULUSMASK = 31;
exports.BLS_PUBLIC_KEY_SIZE = 96;
exports.BLS_POP_SIZE = 48;
exports.blsPrivateKeyToProcessedPrivateKey = function (privateKeyHex) {
    for (var i = 0; i < 256; i++) {
        var originalPrivateKeyBytes = Buffer.from(privateKeyHex, 'hex');
        var iBuffer = new Buffer(1);
        iBuffer[0] = i;
        var keyBytes = Buffer.concat([
            Buffer.from('ecdsatobls', 'utf8'),
            iBuffer,
            originalPrivateKeyBytes,
        ]);
        var privateKeyBLSBytes = keccak256(keyBytes);
        // tslint:disable-next-line:no-bitwise
        privateKeyBLSBytes[0] &= MODULUSMASK;
        var privateKeyNum = BigInteger.fromBuffer(privateKeyBLSBytes);
        if (privateKeyNum.compareTo(n) >= 0) {
            continue;
        }
        var privateKeyBytes = reverse(privateKeyNum.toBuffer());
        return privateKeyBytes;
    }
    throw new Error("couldn't derive BLS key from ECDSA key");
};
var getBlsPrivateKey = function (privateKeyHex) {
    var blsPrivateKeyBytes = exports.blsPrivateKeyToProcessedPrivateKey(privateKeyHex.slice(2));
    return blsPrivateKeyBytes;
};
exports.getBlsPublicKey = function (privateKeyHex) {
    var blsPrivateKeyBytes = getBlsPrivateKey(privateKeyHex);
    return '0x' + bls12377js.BLS.privateToPublicBytes(blsPrivateKeyBytes).toString('hex');
};
exports.getBlsPoP = function (address, privateKeyHex) {
    if (!address_1.isValidAddress(address)) {
        throw new Error('Invalid checksum address for generating BLS proof-of-possession');
    }
    var blsPrivateKeyBytes = getBlsPrivateKey(privateKeyHex);
    return ('0x' +
        bls12377js.BLS.signPoP(blsPrivateKeyBytes, Buffer.from(address.slice(2), 'hex')).toString('hex'));
};
//# sourceMappingURL=bls.js.map