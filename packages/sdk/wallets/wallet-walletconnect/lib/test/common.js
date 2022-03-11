"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var contractkit_1 = require("@celo/contractkit");
var ethereumjs_util_1 = require("ethereumjs-util");
// personal_sign is the one RPC that has [payload, from] rather
// than [from, payload]
function parsePersonalSign(params) {
    var payload = params[0], from = params[1];
    return { from: from, payload: payload };
}
exports.parsePersonalSign = parsePersonalSign;
function parseSignTypedData(params) {
    var from = params[0], payload = params[1];
    return { from: from, payload: JSON.parse(payload) };
}
exports.parseSignTypedData = parseSignTypedData;
function parseSignTransaction(params) {
    return params;
}
exports.parseSignTransaction = parseSignTransaction;
function parseComputeSharedSecret(params) {
    var from = params[0], publicKey = params[1];
    return { from: from, publicKey: publicKey };
}
exports.parseComputeSharedSecret = parseComputeSharedSecret;
function parseDecrypt(params) {
    var from = params[0], payload = params[1];
    return { from: from, payload: Buffer.from(payload, 'hex') };
}
exports.parseDecrypt = parseDecrypt;
var privateKey = '04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976';
var kit = contractkit_1.newKit('https://alfajores-forno.celo-testnet.org');
kit.addAccount(privateKey);
var wallet = kit.getWallet();
var account = wallet.getAccounts()[0];
exports.testWallet = wallet;
exports.testPrivateKey = privateKey;
exports.testAddress = ethereumjs_util_1.toChecksumAddress(account);
//# sourceMappingURL=common.js.map