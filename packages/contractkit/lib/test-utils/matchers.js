"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
expect.extend({
    toBeBigNumber: function (received) {
        var pass = bignumber_js_1.default.isBigNumber(received);
        if (pass) {
            return {
                message: function () { return "expected " + received + " not to be BigNumber"; },
                pass: true,
            };
        }
        else {
            return {
                message: function () { return "expected " + received + " to be bigNumber"; },
                pass: false,
            };
        }
    },
    toEqBigNumber: function (received, _expected) {
        var expected = new bignumber_js_1.default(_expected);
        var pass = expected.eq(received);
        if (pass) {
            return {
                message: function () { return "expected " + received.toString() + " not to equal " + expected.toString(); },
                pass: true,
            };
        }
        else {
            return {
                message: function () { return "expected " + received.toString() + " to equal " + expected.toString(); },
                pass: false,
            };
        }
    },
});
//# sourceMappingURL=matchers.js.map