"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAddress = exports.testPrivateKey = exports.testWallet = exports.parseDecrypt = exports.parseComputeSharedSecret = exports.parseSignTransaction = exports.parseSignTypedData = exports.parsePersonalSign = void 0;
var contractkit_1 = require("@celo/contractkit");
var ethereumjs_util_1 = require("ethereumjs-util");
// personal_sign is the one RPC that has [payload, from] rather
// than [from, payload]
function parsePersonalSign(params) {
    var _a = __read(params, 2), payload = _a[0], from = _a[1];
    return { from: from, payload: payload };
}
exports.parsePersonalSign = parsePersonalSign;
function parseSignTypedData(params) {
    var _a = __read(params, 2), from = _a[0], payload = _a[1];
    return { from: from, payload: JSON.parse(payload) };
}
exports.parseSignTypedData = parseSignTypedData;
function parseSignTransaction(params) {
    return params;
}
exports.parseSignTransaction = parseSignTransaction;
function parseComputeSharedSecret(params) {
    var _a = __read(params, 2), from = _a[0], publicKey = _a[1];
    return { from: from, publicKey: publicKey };
}
exports.parseComputeSharedSecret = parseComputeSharedSecret;
function parseDecrypt(params) {
    var _a = __read(params, 2), from = _a[0], payload = _a[1];
    return { from: from, payload: Buffer.from(payload, 'hex') };
}
exports.parseDecrypt = parseDecrypt;
var privateKey = '04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976';
var kit = (0, contractkit_1.newKit)('https://alfajores-forno.celo-testnet.org');
kit.addAccount(privateKey);
var wallet = kit.getWallet();
var _a = __read(wallet.getAccounts(), 1), account = _a[0];
exports.testWallet = wallet;
exports.testPrivateKey = privateKey;
exports.testAddress = (0, ethereumjs_util_1.toChecksumAddress)(account);
//# sourceMappingURL=common.js.map