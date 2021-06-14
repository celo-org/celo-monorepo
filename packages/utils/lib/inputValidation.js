"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var phoneNumbers_1 = require("./phoneNumbers");
var ValidatorKind;
(function (ValidatorKind) {
    ValidatorKind["Custom"] = "custom";
    ValidatorKind["Decimal"] = "decimal";
    ValidatorKind["Integer"] = "integer";
    ValidatorKind["Phone"] = "phone";
})(ValidatorKind = exports.ValidatorKind || (exports.ValidatorKind = {}));
function validateInteger(input) {
    return input.replace(/[^0-9]/g, '');
}
exports.validateInteger = validateInteger;
function validateDecimal(input, decimalSeparator) {
    if (decimalSeparator === void 0) { decimalSeparator = '.'; }
    var regex = decimalSeparator === ',' ? /[^0-9,]/g : /[^0-9.]/g;
    var cleanedArray = input.replace(regex, '').split(decimalSeparator);
    if (cleanedArray.length <= 1) {
        // Empty string or no decimals
        return cleanedArray.join('');
    }
    else {
        return cleanedArray.shift() + decimalSeparator + cleanedArray.join('');
    }
}
exports.validateDecimal = validateDecimal;
function validatePhone(input, countryCallingCode) {
    input = input.replace(/[^0-9()\- ]/g, '');
    if (!countryCallingCode) {
        return input;
    }
    var displayNumber = phoneNumbers_1.getDisplayPhoneNumber(input, countryCallingCode);
    if (!displayNumber) {
        return input;
    }
    return displayNumber;
}
exports.validatePhone = validatePhone;
function validateInput(input, props) {
    if (!props.validator && !props.customValidator) {
        return input;
    }
    switch (props.validator) {
        case 'decimal':
            return validateDecimal(input, props.decimalSeparator);
        case 'integer':
            return validateInteger(input);
        case 'phone':
            return validatePhone(input, props.countryCallingCode);
        case 'custom': {
            if (props.customValidator) {
                return props.customValidator(input);
            }
        }
    }
    throw new Error('Unhandled input validator');
}
exports.validateInput = validateInput;
//# sourceMappingURL=inputValidation.js.map