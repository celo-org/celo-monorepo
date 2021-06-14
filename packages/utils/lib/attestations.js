"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Web3Utils = __importStar(require("web3-utils"));
var address_1 = require("./address");
var phoneNumbers_1 = require("./phoneNumbers");
var signatureUtils_1 = require("./signatureUtils");
var DEFAULT_NUM_ATTESTATIONS_REQUIRED = 3;
var DEFAULT_ATTESTATION_THRESHOLD = 0.25;
// Supported identifer types for attestations
var IdentifierType;
(function (IdentifierType) {
    IdentifierType[IdentifierType["PHONE_NUMBER"] = 0] = "PHONE_NUMBER";
    // In the future, other types like usernames or emails could go here
})(IdentifierType = exports.IdentifierType || (exports.IdentifierType = {}));
// Each identifer type has a unique prefix to prevent unlikely but possible collisions
function getIdentifierPrefix(type) {
    switch (type) {
        case IdentifierType.PHONE_NUMBER:
            return 'tel://';
        default:
            throw new Error('Unsupported Identifier Type');
    }
}
exports.getIdentifierPrefix = getIdentifierPrefix;
function hashIdentifier(identifier, type, salt) {
    switch (type) {
        case IdentifierType.PHONE_NUMBER:
            return phoneNumbers_1.PhoneNumberUtils.getPhoneHash(identifier, salt);
        default:
            throw new Error('Unsupported Identifier Type');
    }
}
exports.hashIdentifier = hashIdentifier;
function getAttestationMessageToSignFromIdentifier(identifier, account) {
    var messageHash = Web3Utils.soliditySha3({ type: 'bytes32', value: identifier }, { type: 'address', value: account });
    return messageHash;
}
exports.getAttestationMessageToSignFromIdentifier = getAttestationMessageToSignFromIdentifier;
function getAttestationMessageToSignFromPhoneNumber(phoneNumber, account, phoneSalt) {
    return getAttestationMessageToSignFromIdentifier(hashIdentifier(phoneNumber, IdentifierType.PHONE_NUMBER, phoneSalt), account);
}
exports.getAttestationMessageToSignFromPhoneNumber = getAttestationMessageToSignFromPhoneNumber;
function base64ToHex(base64String) {
    return '0x' + Buffer.from(base64String, 'base64').toString('hex');
}
exports.base64ToHex = base64ToHex;
function attestToIdentifier(identifier, account, privateKey) {
    var issuer = address_1.privateKeyToAddress(privateKey);
    var _a = signatureUtils_1.SignatureUtils.signMessage(getAttestationMessageToSignFromIdentifier(identifier, account), privateKey, issuer), v = _a.v, r = _a.r, s = _a.s;
    return { v: v, r: r, s: s };
}
exports.attestToIdentifier = attestToIdentifier;
function sanitizeMessageBase64(base64String) {
    // Replace occurrences of ¿ with _. Unsure why that is happening right now
    return base64String.replace(/(¿|§)/gi, '_');
}
exports.sanitizeMessageBase64 = sanitizeMessageBase64;
var attestationCodeRegex = new RegExp(/(.* |^)(?:celo:\/\/wallet\/v\/)?([a-zA-Z0-9=\+\/_-]{87,88})($| .*)/);
function messageContainsAttestationCode(message) {
    return attestationCodeRegex.test(message);
}
exports.messageContainsAttestationCode = messageContainsAttestationCode;
function extractAttestationCodeFromMessage(message) {
    var sanitizedMessage = sanitizeMessageBase64(message);
    if (!messageContainsAttestationCode(sanitizedMessage)) {
        return null;
    }
    var matches = sanitizedMessage.match(attestationCodeRegex);
    if (!matches || matches.length < 3) {
        return null;
    }
    return base64ToHex(matches[2]);
}
exports.extractAttestationCodeFromMessage = extractAttestationCodeFromMessage;
/**
 * Returns true if an AttestationStat is considered verified using the given factors,
 * or defaults if factors are ommited.
 * @param stats AttestationStat of the account's attestation identitifer, retrievable via lookupIdentitfiers
 * @param numAttestationsRequired Optional number of attestations required.  Will default to
 *  hardcoded value if absent.
 * @param attestationThreshold Optional threshold for fraction attestations completed. Will
 *  default to hardcoded value if absent.
 */
function isAccountConsideredVerified(stats, numAttestationsRequired, attestationThreshold) {
    if (numAttestationsRequired === void 0) { numAttestationsRequired = DEFAULT_NUM_ATTESTATIONS_REQUIRED; }
    if (attestationThreshold === void 0) { attestationThreshold = DEFAULT_ATTESTATION_THRESHOLD; }
    if (!stats) {
        return {
            isVerified: false,
            numAttestationsRemaining: 0,
            total: 0,
            completed: 0,
        };
    }
    var numAttestationsRemaining = numAttestationsRequired - stats.completed;
    var fractionAttestation = stats.total < 1 ? 0 : stats.completed / stats.total;
    // 'verified' is a term of convenience to mean that the attestation stats for a
    // given identifier are beyond a certain threshold of confidence
    var isVerified = numAttestationsRemaining <= 0 && fractionAttestation >= attestationThreshold;
    return {
        isVerified: isVerified,
        numAttestationsRemaining: numAttestationsRemaining,
        total: stats.total,
        completed: stats.completed,
    };
}
exports.isAccountConsideredVerified = isAccountConsideredVerified;
exports.AttestationUtils = {
    IdentifierType: IdentifierType,
    getIdentifierPrefix: getIdentifierPrefix,
    hashIdentifier: hashIdentifier,
    getAttestationMessageToSignFromIdentifier: getAttestationMessageToSignFromIdentifier,
    getAttestationMessageToSignFromPhoneNumber: getAttestationMessageToSignFromPhoneNumber,
    base64ToHex: base64ToHex,
    attestToIdentifier: attestToIdentifier,
    sanitizeMessageBase64: sanitizeMessageBase64,
    messageContainsAttestationCode: messageContainsAttestationCode,
    extractAttestationCodeFromMessage: extractAttestationCodeFromMessage,
    isAccountConsideredVerified: isAccountConsideredVerified,
};
//# sourceMappingURL=attestations.js.map