"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=inputValidation.js.map