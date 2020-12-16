"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var attestations_1 = require("./attestations");
var PHONE_SALT_SEPARATOR = '__';
var E164_REGEX = /^\+[1-9][0-9]{1,14}$/;
exports.getPhoneHash = function (sha3, phoneNumber, salt) {
    if (!phoneNumber || !isE164Number(phoneNumber)) {
        throw Error('Attempting to hash a non-e164 number: ' + phoneNumber);
    }
    var prefix = attestations_1.getIdentifierPrefix(attestations_1.IdentifierType.PHONE_NUMBER);
    var value = prefix + (salt ? phoneNumber + PHONE_SALT_SEPARATOR + salt : phoneNumber);
    return sha3(value);
};
function isE164Number(phoneNumber) {
    return E164_REGEX.test(phoneNumber);
}
exports.isE164Number = isE164Number;
function anonymizedPhone(phoneNumber) {
    return phoneNumber.slice(0, -4) + 'XXXX';
}
exports.anonymizedPhone = anonymizedPhone;
exports.PhoneNumberBase = {
    getPhoneHash: exports.getPhoneHash,
    isE164Number: isE164Number,
};
//# sourceMappingURL=phoneNumbers.js.map