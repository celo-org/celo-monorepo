"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ethereumjs_util_1 = require("ethereumjs-util");
var Either_1 = require("fp-ts/lib/Either");
var t = __importStar(require("io-ts"));
var address_1 = require("./address");
var phoneNumbers_1 = require("./phoneNumbers");
// from http://urlregex.com/
exports.URL_REGEX = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/);
exports.isValidUrl = function (url) { return exports.URL_REGEX.test(url); };
exports.UrlType = new t.Type('Url', t.string.is, function (input, context) {
    return Either_1.either.chain(t.string.validate(input, context), function (stringValue) {
        return exports.URL_REGEX.test(stringValue)
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
    blacklistedRegionCodes: t.array(t.string),
    accountAddress: exports.AddressType,
    signature: t.union([exports.SignatureType, t.undefined]),
});
exports.AttestationServiceTestRequestType = t.type({
    phoneNumber: exports.E164PhoneNumberType,
    message: t.string,
    signature: exports.SignatureType,
});
//# sourceMappingURL=io.js.map