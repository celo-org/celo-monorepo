"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parsing_1 = require("./parsing");
test('stringToBoolean()', function () {
    expect(parsing_1.stringToBoolean('true')).toBe(true);
    expect(parsing_1.stringToBoolean('      true    ')).toBe(true);
    expect(parsing_1.stringToBoolean('false')).toBe(false);
    expect(parsing_1.stringToBoolean('      false   ')).toBe(false);
    expect(parsing_1.stringToBoolean('FaLse')).toBe(false);
    expect(parsing_1.stringToBoolean('TruE')).toBe(true);
    expect(function () { return parsing_1.stringToBoolean('fals'); }).toThrow("Unable to parse 'fals' as boolean");
});
//# sourceMappingURL=parsing.test.js.map