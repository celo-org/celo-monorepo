"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
var parsing_1 = require("@celo/base/lib/parsing");
exports.parseSolidityStringArray = parsing_1.parseSolidityStringArray;
exports.stringToBoolean = parsing_1.stringToBoolean;
exports.parseInputAmount = function (inputString, decimalSeparator) {
    if (decimalSeparator === void 0) { decimalSeparator = '.'; }
    if (decimalSeparator !== '.') {
        inputString = inputString.replace(decimalSeparator, '.');
    }
    return new bignumber_js_1.default(inputString || '0');
};
//# sourceMappingURL=parsing.js.map