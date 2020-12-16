"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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