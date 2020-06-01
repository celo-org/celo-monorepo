"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const address_1 = require("@celo/utils/lib/address");
const constants_1 = require("./constants");
function hasValidAccountParam(requestBody) {
    return requestBody.account && address_1.isValidAddress(requestBody.account);
}
exports.hasValidAccountParam = hasValidAccountParam;
function hasValidUserPhoneNumberParam(requestBody) {
    return requestBody.userPhoneNumber;
}
exports.hasValidUserPhoneNumberParam = hasValidUserPhoneNumberParam;
function hasValidContractPhoneNumbersParam(requestBody) {
    return requestBody.contactPhoneNumbers && Array.isArray(requestBody.contactPhoneNumbers);
}
exports.hasValidContractPhoneNumbersParam = hasValidContractPhoneNumbersParam;
function isBodyReasonablySized(requestBody) {
    return JSON.stringify(requestBody).length <= constants_1.REASONABLE_BODY_CHAR_LIMIT;
}
exports.isBodyReasonablySized = isBodyReasonablySized;
function hasValidQueryPhoneNumberParam(requestBody) {
    return requestBody.blindedQueryPhoneNumber;
}
exports.hasValidQueryPhoneNumberParam = hasValidQueryPhoneNumberParam;
function phoneNumberHashIsValidIfExists(requestBody) {
    return !requestBody.hashedPhoneNumber || isByte32(requestBody.hashedPhoneNumber);
}
exports.phoneNumberHashIsValidIfExists = phoneNumberHashIsValidIfExists;
function isByte32(hashedData) {
    return Buffer.byteLength(address_1.trimLeading0x(hashedData), 'hex') === 32;
}
//# sourceMappingURL=input-validation.js.map