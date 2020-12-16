"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phoneNumbers_1 = require("@celo/base/lib/phoneNumbers");
var country_data_1 = __importDefault(require("country-data"));
var google_libphonenumber_1 = require("google-libphonenumber");
var web3_utils_1 = require("web3-utils");
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
var phoneNumbers_2 = require("@celo/base/lib/phoneNumbers");
exports.anonymizedPhone = phoneNumbers_2.anonymizedPhone;
exports.isE164Number = phoneNumbers_2.isE164Number;
var sha3 = function (v) { return web3_utils_1.soliditySha3({ type: 'string', value: v }); };
exports.getPhoneHash = function (phoneNumber, salt) {
    return phoneNumbers_1.getPhoneHash(sha3, phoneNumber, salt);
};
var phoneUtil = google_libphonenumber_1.PhoneNumberUtil.getInstance();
var MIN_PHONE_LENGTH = 4;
function getCountryEmoji(e164PhoneNumber, countryCodePossible, regionCodePossible) {
    // The country code and region code can both be passed in, or it can be inferred from the e164PhoneNumber
    var countryCode;
    var regionCode;
    countryCode = countryCodePossible;
    regionCode = regionCodePossible;
    if (!countryCode || !regionCode) {
        countryCode = getCountryCode(e164PhoneNumber);
        regionCode = getRegionCode(e164PhoneNumber);
    }
    var countries = country_data_1.default.lookup.countries({ countryCallingCodes: "+" + countryCode });
    var userCountryArray = countries.filter(function (c) { return c.alpha2 === regionCode; });
    var country = userCountryArray.length > 0 ? userCountryArray[0] : undefined;
    return country ? country.emoji : '';
}
exports.getCountryEmoji = getCountryEmoji;
function getCountryCode(e164PhoneNumber) {
    if (!e164PhoneNumber) {
        return null;
    }
    try {
        return phoneUtil.parse(e164PhoneNumber).getCountryCode();
    }
    catch (error) {
        console.debug("getCountryCode, number: " + e164PhoneNumber + ", error: " + error);
        return null;
    }
}
exports.getCountryCode = getCountryCode;
function getRegionCode(e164PhoneNumber) {
    if (!e164PhoneNumber) {
        return null;
    }
    try {
        return phoneUtil.getRegionCodeForNumber(phoneUtil.parse(e164PhoneNumber));
    }
    catch (error) {
        console.debug("getRegionCodeForNumber, number: " + e164PhoneNumber + ", error: " + error);
        return null;
    }
}
exports.getRegionCode = getRegionCode;
function getRegionCodeFromCountryCode(countryCode) {
    if (!countryCode) {
        return null;
    }
    try {
        return phoneUtil.getRegionCodeForCountryCode(parseInt(countryCode, 10));
    }
    catch (error) {
        console.debug("getRegionCodeFromCountryCode, countrycode: " + countryCode + ", error: " + error);
        return null;
    }
}
exports.getRegionCodeFromCountryCode = getRegionCodeFromCountryCode;
function getDisplayPhoneNumber(phoneNumber, defaultCountryCode) {
    var phoneDetails = parsePhoneNumber(phoneNumber, defaultCountryCode);
    if (phoneDetails) {
        return phoneDetails.displayNumber;
    }
    else {
        // Fallback to input instead of showing nothing for invalid numbers
        return phoneNumber;
    }
}
exports.getDisplayPhoneNumber = getDisplayPhoneNumber;
function getDisplayNumberInternational(e164PhoneNumber) {
    var countryCode = getCountryCode(e164PhoneNumber);
    var phoneDetails = parsePhoneNumber(e164PhoneNumber, (countryCode || '').toString());
    if (phoneDetails) {
        return phoneDetails.displayNumberInternational;
    }
    else {
        // Fallback to input instead of showing nothing for invalid numbers
        return e164PhoneNumber;
    }
}
exports.getDisplayNumberInternational = getDisplayNumberInternational;
function getE164DisplayNumber(e164PhoneNumber) {
    var countryCode = getCountryCode(e164PhoneNumber);
    return getDisplayPhoneNumber(e164PhoneNumber, (countryCode || '').toString());
}
exports.getE164DisplayNumber = getE164DisplayNumber;
function getE164Number(phoneNumber, defaultCountryCode) {
    var phoneDetails = parsePhoneNumber(phoneNumber, defaultCountryCode);
    if (phoneDetails && phoneNumbers_1.isE164Number(phoneDetails.e164Number)) {
        return phoneDetails.e164Number;
    }
    else {
        return null;
    }
}
exports.getE164Number = getE164Number;
// Actually runs through the parsing instead of using a regex
function isE164NumberStrict(phoneNumber) {
    try {
        var parsedPhoneNumber = phoneUtil.parse(phoneNumber);
        if (!phoneUtil.isValidNumber(parsedPhoneNumber)) {
            return false;
        }
        return phoneUtil.format(parsedPhoneNumber, google_libphonenumber_1.PhoneNumberFormat.E164) === phoneNumber;
    }
    catch (_a) {
        return false;
    }
}
exports.isE164NumberStrict = isE164NumberStrict;
function parsePhoneNumber(phoneNumberRaw, defaultCountryCode) {
    try {
        if (!phoneNumberRaw || phoneNumberRaw.length < MIN_PHONE_LENGTH) {
            return null;
        }
        var defaultRegionCode = defaultCountryCode
            ? getRegionCodeFromCountryCode(defaultCountryCode)
            : null;
        var parsedNumberUnfixed = phoneUtil.parse(phoneNumberRaw, defaultRegionCode || undefined);
        var parsedCountryCode = parsedNumberUnfixed.getCountryCode();
        var parsedRegionCode = phoneUtil.getRegionCodeForNumber(parsedNumberUnfixed);
        var parsedNumber = handleSpecialCasesForParsing(parsedNumberUnfixed, parsedCountryCode, parsedRegionCode);
        if (!parsedNumber) {
            return null;
        }
        var isValid = phoneUtil.isValidNumberForRegion(parsedNumber, parsedRegionCode);
        return isValid
            ? {
                e164Number: phoneUtil.format(parsedNumber, google_libphonenumber_1.PhoneNumberFormat.E164),
                displayNumber: handleSpecialCasesForDisplay(parsedNumber, parsedCountryCode),
                displayNumberInternational: phoneUtil.format(parsedNumber, google_libphonenumber_1.PhoneNumberFormat.INTERNATIONAL),
                countryCode: parsedCountryCode,
                regionCode: parsedRegionCode,
            }
            : null;
    }
    catch (error) {
        console.debug("phoneNumbers/parsePhoneNumber/Failed to parse phone number, error: " + error);
        return null;
    }
}
exports.parsePhoneNumber = parsePhoneNumber;
function handleSpecialCasesForParsing(parsedNumber, countryCode, regionCode) {
    if (!countryCode || !regionCode) {
        return parsedNumber;
    }
    switch (countryCode) {
        // Argentina
        // https://github.com/googlei18n/libphonenumber/blob/master/FAQ.md#why-is-this-number-from-argentina-ar-or-mexico-mx-not-identified-as-the-right-number-type
        // https://en.wikipedia.org/wiki/Telephone_numbers_in_Argentina
        case 54:
            return prependToFormMobilePhoneNumber(parsedNumber, regionCode, '9');
        default:
            return parsedNumber;
    }
}
// TODO(Rossy) Given the inconsistencies of numbers around the world, we should
// display e164 everywhere to ensure users knows exactly who their sending money to
function handleSpecialCasesForDisplay(parsedNumber, countryCode) {
    switch (countryCode) {
        // Argentina
        // The Google lib formatter incorretly adds '15' to the nationally formatted number for Argentina
        // However '15' is only needed when calling a mobile from a landline
        case 54:
            return phoneUtil
                .format(parsedNumber, google_libphonenumber_1.PhoneNumberFormat.INTERNATIONAL)
                .replace(/\+54(\s)?/, '');
        case 231:
            var formatted = phoneUtil.format(parsedNumber, google_libphonenumber_1.PhoneNumberFormat.NATIONAL);
            return formatted && formatted[0] === '0' ? formatted.slice(1) : formatted;
        default:
            return phoneUtil.format(parsedNumber, google_libphonenumber_1.PhoneNumberFormat.NATIONAL);
    }
}
/**
 * Some countries require a prefix before the area code depending on if the number is
 * mobile vs landline and international vs national
 */
function prependToFormMobilePhoneNumber(parsedNumber, regionCode, prefix) {
    if (phoneUtil.getNumberType(parsedNumber) === google_libphonenumber_1.PhoneNumberType.MOBILE) {
        return parsedNumber;
    }
    var nationalNumber = phoneUtil.format(parsedNumber, google_libphonenumber_1.PhoneNumberFormat.NATIONAL);
    // Nationally formatted numbers sometimes contain leading 0
    if (nationalNumber.charAt(0) === '0') {
        nationalNumber = nationalNumber.slice(1);
    }
    // If the number already starts with prefix, don't prepend it again
    if (nationalNumber.startsWith(prefix)) {
        return null;
    }
    var adjustedNumber = phoneUtil.parse(prefix + nationalNumber, regionCode);
    return phoneUtil.getNumberType(adjustedNumber) === google_libphonenumber_1.PhoneNumberType.MOBILE ? adjustedNumber : null;
}
function getExampleNumber(regionCode, useOnlyZeroes, isInternational) {
    if (useOnlyZeroes === void 0) { useOnlyZeroes = true; }
    if (isInternational === void 0) { isInternational = false; }
    var examplePhone = phoneUtil.getExampleNumber(getRegionCodeFromCountryCode(regionCode));
    if (!examplePhone) {
        return;
    }
    var formatedExample = phoneUtil.format(examplePhone, isInternational ? google_libphonenumber_1.PhoneNumberFormat.INTERNATIONAL : google_libphonenumber_1.PhoneNumberFormat.NATIONAL);
    if (useOnlyZeroes) {
        if (isInternational) {
            return formatedExample.replace(/(^\+[0-9]{1,3} |[0-9])/g, function (value, _, i) { return (i ? '0' : value); });
        }
        return formatedExample.replace(/[0-9]/g, '0');
    }
    return formatedExample;
}
exports.getExampleNumber = getExampleNumber;
exports.PhoneNumberUtils = {
    getPhoneHash: exports.getPhoneHash,
    getCountryCode: getCountryCode,
    getRegionCode: getRegionCode,
    getDisplayPhoneNumber: getDisplayPhoneNumber,
    getE164Number: getE164Number,
    isE164Number: phoneNumbers_1.isE164Number,
    parsePhoneNumber: parsePhoneNumber,
};
//# sourceMappingURL=phoneNumbers.js.map