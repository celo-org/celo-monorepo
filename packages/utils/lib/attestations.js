"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var attestations_1 = require("@celo/base/lib/attestations");
var web3_utils_1 = require("web3-utils");
var address_1 = require("./address");
var signatureUtils_1 = require("./signatureUtils");
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
var attestations_2 = require("@celo/base/lib/attestations");
exports.base64ToHex = attestations_2.base64ToHex;
exports.extractAttestationCodeFromMessage = attestations_2.extractAttestationCodeFromMessage;
exports.getIdentifierPrefix = attestations_2.getIdentifierPrefix;
exports.IdentifierType = attestations_2.IdentifierType;
exports.isAccountConsideredVerified = attestations_2.isAccountConsideredVerified;
exports.messageContainsAttestationCode = attestations_2.messageContainsAttestationCode;
exports.sanitizeMessageBase64 = attestations_2.sanitizeMessageBase64;
var sha3 = function (v) { return web3_utils_1.soliditySha3({ type: 'string', value: v }); };
function hashIdentifier(identifier, type, salt) {
    return attestations_1.hashIdentifier(sha3, identifier, type, salt);
}
exports.hashIdentifier = hashIdentifier;
function getAttestationMessageToSignFromIdentifier(identifier, account) {
    var messageHash = web3_utils_1.soliditySha3({ type: 'bytes32', value: identifier }, { type: 'address', value: account });
    return messageHash;
}
exports.getAttestationMessageToSignFromIdentifier = getAttestationMessageToSignFromIdentifier;
function getAttestationMessageToSignFromPhoneNumber(phoneNumber, account, phoneSalt) {
    return getAttestationMessageToSignFromIdentifier(hashIdentifier(phoneNumber, attestations_1.IdentifierType.PHONE_NUMBER, phoneSalt), account);
}
exports.getAttestationMessageToSignFromPhoneNumber = getAttestationMessageToSignFromPhoneNumber;
function attestToIdentifier(identifier, account, privateKey) {
    var issuer = address_1.privateKeyToAddress(privateKey);
    var _a = signatureUtils_1.SignatureUtils.signMessage(getAttestationMessageToSignFromIdentifier(identifier, account), privateKey, issuer), v = _a.v, r = _a.r, s = _a.s;
    return { v: v, r: r, s: s };
}
exports.attestToIdentifier = attestToIdentifier;
exports.AttestationUtils = {
    IdentifierType: attestations_1.IdentifierType,
    getIdentifierPrefix: attestations_1.getIdentifierPrefix,
    hashIdentifier: hashIdentifier,
    getAttestationMessageToSignFromIdentifier: getAttestationMessageToSignFromIdentifier,
    getAttestationMessageToSignFromPhoneNumber: getAttestationMessageToSignFromPhoneNumber,
    base64ToHex: attestations_1.base64ToHex,
    attestToIdentifier: attestToIdentifier,
    sanitizeMessageBase64: attestations_1.sanitizeMessageBase64,
    messageContainsAttestationCode: attestations_1.messageContainsAttestationCode,
    extractAttestationCodeFromMessage: attestations_1.extractAttestationCodeFromMessage,
    isAccountConsideredVerified: attestations_1.isAccountConsideredVerified,
};
//# sourceMappingURL=attestations.js.map