"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var inputValidation_1 = require("@celo/base/lib/inputValidation");
var phoneNumbers_1 = require("./phoneNumbers");
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
var inputValidation_2 = require("@celo/base/lib/inputValidation");
exports.validateDecimal = inputValidation_2.validateDecimal;
exports.validateInteger = inputValidation_2.validateInteger;
exports.ValidatorKind = inputValidation_2.ValidatorKind;
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
            return inputValidation_1.validateDecimal(input, props.decimalSeparator);
        case 'integer':
            return inputValidation_1.validateInteger(input);
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