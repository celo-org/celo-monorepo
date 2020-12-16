"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
exports.digits = new bignumber_js_1.default('24');
exports.fixed1 = new bignumber_js_1.default('1000000000000000000000000');
exports.toFixed = function (n) {
    return exports.fixed1.times(n).integerValue(bignumber_js_1.default.ROUND_FLOOR);
};
// Keeps the decimal portion
exports.fromFixed = function (f) {
    return f.div(exports.fixed1);
};
// Returns an integer
exports.fixedToInt = function (f) {
    return f.idiv(exports.fixed1);
};
exports.multiply = function (a, b) {
    return a.times(b).idiv(exports.fixed1);
};
//# sourceMappingURL=fixidity.js.map