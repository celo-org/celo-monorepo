"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bls12377js_blind_1 = require("bls12377js-blind");
const config_1 = __importDefault(require("../config"));
/*
 * Computes the BLS Salt for the blinded phone number.
 */
function computeBLSSalt(queryPhoneNumber) {
    try {
        const privateKey = new Buffer(config_1.default.salt.key);
        return bls12377js_blind_1.BLINDBLS.computePRF(privateKey, new Buffer(queryPhoneNumber));
    }
    catch (e) {
        console.error('Failed to compute salt', e);
        throw e;
    }
}
exports.computeBLSSalt = computeBLSSalt;
//# sourceMappingURL=bls-salt.js.map