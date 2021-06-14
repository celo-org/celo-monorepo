"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
exports.stringToBoolean = function (inputString) {
    var lowercasedInput = inputString.toLowerCase().trim();
    if (lowercasedInput === 'true') {
        return true;
    }
    else if (lowercasedInput === 'false') {
        return false;
    }
    throw new Error("Unable to parse '" + inputString + "' as boolean");
};
exports.parseInputAmount = function (inputString, decimalSeparator) {
    if (decimalSeparator === void 0) { decimalSeparator = '.'; }
    if (decimalSeparator !== '.') {
        inputString = inputString.replace(decimalSeparator, '.');
    }
    return new bignumber_js_1.default(inputString || '0');
};
/**
 * Parses an "array of strings" that is returned from a Solidity function
 *
 * @param stringLengths length of each string in bytes
 * @param data 0x-prefixed, hex-encoded string data in utf-8 bytes
 */
exports.parseSolidityStringArray = function (stringLengths, data) {
    if (data === null) {
        data = '0x';
    }
    var ret = [];
    var offset = 0;
    // @ts-ignore
    var rawData = Buffer.from(data.slice(2), 'hex');
    // tslint:disable-next-line:prefer-for-of
    for (var i = 0; i < stringLengths.length; i++) {
        var string = rawData.toString('utf-8', offset, offset + stringLengths[i]);
        offset += stringLengths[i];
        ret.push(string);
    }
    return ret;
};
//# sourceMappingURL=parsing.js.map