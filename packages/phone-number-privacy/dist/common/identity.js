"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
const config_1 = __importDefault(require("../config"));
const contracts_1 = require("../web3/contracts");
const logger_1 = __importDefault(require("./logger"));
/*
 * Confirms that user is who they say they are and throws error on failure to confirm.
 * Authorization header should contain the EC signed body
 */
function authenticateUser(request) {
    logger_1.default.debug('Authenticating user');
    // https://tools.ietf.org/html/rfc7235#section-4.2
    const messageSignature = request.get('Authorization');
    const signer = request.body.account;
    if (!messageSignature || !signer) {
        return false;
    }
    const message = JSON.stringify(request.body);
    return signatureUtils_1.verifySignature(message, messageSignature, signer);
}
exports.authenticateUser = authenticateUser;
async function isVerified(account, hashedPhoneNumber) {
    // TODO (amyslawson) wrap forno request in retry
    const attestationsWrapper = await contracts_1.getContractKit().contracts.getAttestations();
    const attestationStats = await attestationsWrapper.getAttestationStat(hashedPhoneNumber, account);
    const numAttestationsCompleted = attestationStats.completed;
    const numAttestationsRemaining = config_1.default.attestations.numberAttestationsRequired - numAttestationsCompleted;
    return numAttestationsRemaining <= 0;
}
exports.isVerified = isVerified;
//# sourceMappingURL=identity.js.map