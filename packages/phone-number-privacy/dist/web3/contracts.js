"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const contractkit_1 = require("@celo/contractkit");
const config_1 = __importDefault(require("../config"));
const contractKit = contractkit_1.newKit(config_1.default.blockchain.provider);
function getContractKit() {
    return contractKit;
}
exports.getContractKit = getContractKit;
//# sourceMappingURL=contracts.js.map