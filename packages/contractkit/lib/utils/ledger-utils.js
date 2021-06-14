"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var debug = debug_1.default('kit:wallet:ledger');
function transportErrorFriendlyMessage(error) {
    debug('Possible connection lost with the ledger');
    debug("Error message: " + error.message);
    if (error.statusCode === 26368 || error.statusCode === 26628 || error.message === 'NoDevice') {
        throw new Error("Possible connection lost with the ledger. Check if still on and connected. " + error.message);
    }
    throw error;
}
exports.transportErrorFriendlyMessage = transportErrorFriendlyMessage;
//# sourceMappingURL=ledger-utils.js.map