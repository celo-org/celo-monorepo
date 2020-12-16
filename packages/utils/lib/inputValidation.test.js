"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var inputValidation_1 = require("./inputValidation");
describe('inputValidation', function () {
    function validateFunction(itStr, inputs, validator, expected, props) {
        it(itStr, function () {
            return inputs.forEach(function (input) {
                var result = inputValidation_1.validateInput(input, __assign({ validator: validator, countryCallingCode: '1' }, props));
                expect(result).toEqual(expected);
            });
        });
    }
    var numbers = ['bu1.23n', '1.2.3', '1.23', '1.2.-_[`/,zx3.....', '1.b.23'];
    validateFunction('validates integers', numbers, inputValidation_1.ValidatorKind.Integer, '123');
    validateFunction('validates decimals', numbers, inputValidation_1.ValidatorKind.Decimal, '1.23');
    validateFunction('allows comma decimals', numbers.map(function (val) { return val.replace('.', ','); }), inputValidation_1.ValidatorKind.Decimal, '1,23', { decimalSeparator: ',' });
    validateFunction('validates phone numbers', [
        '4023939889',
        '(402)3939889',
        '(402)393-9889',
        '402bun393._=988-9',
        '402 393 9889',
        '(4023) 9-39-88-9',
        '4-0-2-3-9-3-9-8-8-9',
    ], inputValidation_1.ValidatorKind.Phone, '(402) 393-9889');
});
//# sourceMappingURL=inputValidation.test.js.map