"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var WEI_PER_UNIT = 1000000000000000000;
// A small amount returns a rate closer to the median rate
exports.DOLLAR_AMOUNT_FOR_ESTIMATE = new bignumber_js_1.default(0.01 * WEI_PER_UNIT); // 0.01 dollar
exports.CELO_AMOUNT_FOR_ESTIMATE = new bignumber_js_1.default(0.01 * WEI_PER_UNIT); // 0.01 celo
//# sourceMappingURL=celoHistory.js.map