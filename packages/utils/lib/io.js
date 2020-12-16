"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var io_1 = require("@celo/base/lib/io");
var ethereumjs_util_1 = require("ethereumjs-util");
var Either_1 = require("fp-ts/lib/Either");
var t = __importStar(require("io-ts"));
var address_1 = require("./address");
var phoneNumbers_1 = require("./phoneNumbers");
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
var io_2 = require("@celo/base/lib/io");
exports.isValidUrl = io_2.isValidUrl;
exports.URL_REGEX = io_2.URL_REGEX;
exports.UrlType = new t.Type('Url', t.string.is, function (input, context) {
    return Either_1.either.chain(t.string.validate(input, context), function (stringValue) {
        return io_1.URL_REGEX.test(stringValue)
            ? t.success(stringValue)
            : t.failure(stringValue, context, 'is not a valid url');
    });
}, String);
exports.JSONStringType = new t.Type('JSONString', t.string.is, function (input, context) {
    return Either_1.either.chain(t.string.validate(input, context), function (stringValue) {
        try {
            JSON.parse(stringValue);
            return t.success(stringValue);
        }
        catch (error) {
            return t.failure(stringValue, context, 'can not be parsed as JSON');
        }
    });
}, String);
exports.E164PhoneNumberType = new t.Type('E164Number', t.string.is, function (input, context) {
    return Either_1.either.chain(t.string.validate(input, context), function (stringValue) {
        return phoneNumbers_1.isE164NumberStrict(stringValue)
            ? t.success(stringValue)
            : t.failure(stringValue, context, 'is not a valid e164 number');
    });
}, String);
exports.AddressType = new t.Type('Address', t.string.is, function (input, context) {
    return Either_1.either.chain(t.string.validate(input, context), function (stringValue) {
        return address_1.isValidAddress(stringValue)
            ? t.success(ethereumjs_util_1.toChecksumAddress(stringValue))
            : t.failure(stringValue, context, 'is not a valid address');
    });
}, String);
exports.PublicKeyType = new t.Type('Public Key', t.string.is, function (input, context) {
    return Either_1.either.chain(t.string.validate(input, context), function (stringValue) {
        return stringValue.startsWith('0x') && ethereumjs_util_1.isValidPublic(Buffer.from(stringValue.slice(2), 'hex'), true)
            ? t.success(ethereumjs_util_1.toChecksumAddress(stringValue))
            : t.failure(stringValue, context, 'is not a valid public key');
    });
}, String);
exports.SignatureType = t.string;
exports.SaltType = t.string;
exports.AttestationServiceStatusResponseType = t.type({
    status: t.literal('ok'),
    smsProviders: t.array(t.string),
    blacklistedRegionCodes: t.union([t.array(t.string), t.undefined]),
    accountAddress: exports.AddressType,
    signature: t.union([exports.SignatureType, t.undefined]),
    version: t.string,
    latestBlock: t.number,
    ageOfLatestBlock: t.number,
    isNodeSyncing: t.boolean,
    appSignature: t.string,
});
exports.AttestationServiceTestRequestType = t.type({
    phoneNumber: exports.E164PhoneNumberType,
    message: t.string,
    signature: exports.SignatureType,
    provider: t.union([t.string, t.undefined]),
});
exports.AttestationRequestType = t.type({
    phoneNumber: exports.E164PhoneNumberType,
    account: exports.AddressType,
    issuer: exports.AddressType,
    // io-ts way of defining optional key-value pair
    salt: t.union([t.undefined, exports.SaltType]),
    smsRetrieverAppSig: t.union([t.undefined, t.string]),
    // if specified, the message sent will be short random number prefixed by this string
    securityCodePrefix: t.union([t.undefined, t.string]),
    language: t.union([t.undefined, t.string]),
});
exports.GetAttestationRequestType = t.type({
    phoneNumber: exports.E164PhoneNumberType,
    account: exports.AddressType,
    issuer: exports.AddressType,
    // io-ts way of defining optional key-value pair
    salt: t.union([t.undefined, exports.SaltType]),
    // if the value supplied matches the stored security code, the response will include the complete message
    securityCode: t.union([t.undefined, t.string]),
});
exports.AttestationResponseType = t.type({
    // Always returned in 1.0.x
    success: t.boolean,
    // Returned for errors in 1.0.x
    error: t.union([t.undefined, t.string]),
    // Stringifyed JSON dict of dicts, mapping attempt to error info.
    errors: t.union([t.undefined, t.string]),
    // Returned for successful send in 1.0.x
    provider: t.union([t.undefined, t.string]),
    // New fields
    identifier: t.union([t.undefined, t.string]),
    account: t.union([t.undefined, exports.AddressType]),
    issuer: t.union([t.undefined, exports.AddressType]),
    status: t.union([t.undefined, t.string]),
    attempt: t.union([t.undefined, t.number]),
    countryCode: t.union([t.undefined, t.string]),
    // Time to receive eventual delivery/failure (inc retries)
    duration: t.union([t.undefined, t.number]),
    // Only used by test endpoint to return randomly generated salt.
    // Never return a user-supplied salt.
    salt: t.union([t.undefined, t.string]),
    // only returned if the request supplied the correct security code
    attestationCode: t.union([t.undefined, t.string]),
});
//# sourceMappingURL=io.js.map