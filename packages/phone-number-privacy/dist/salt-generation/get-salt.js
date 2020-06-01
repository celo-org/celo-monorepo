"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bls_cryptography_client_1 = require("../bls/bls-cryptography-client");
const error_utils_1 = require("../common/error-utils");
const identity_1 = require("../common/identity");
const input_validation_1 = require("../common/input-validation");
const logger_1 = __importDefault(require("../common/logger"));
const database_1 = require("../database/database");
const account_1 = require("../database/wrappers/account");
const query_quota_1 = require("./query-quota");
async function handleGetBlindedMessageForSalt(request, response) {
    let trx;
    try {
        trx = await database_1.getTransaction();
        if (!isValidGetSignatureInput(request.body)) {
            error_utils_1.respondWithError(response, 400, error_utils_1.ErrorMessages.INVALID_INPUT);
            return;
        }
        if (!identity_1.authenticateUser(request)) {
            error_utils_1.respondWithError(response, 401, error_utils_1.ErrorMessages.UNAUTHENTICATED_USER);
            return;
        }
        const remainingQueryCount = await query_quota_1.getRemainingQueryCount(trx, request.body.account, request.body.hashedPhoneNumber);
        if (remainingQueryCount <= 0) {
            trx.rollback();
            error_utils_1.respondWithError(response, 403, error_utils_1.ErrorMessages.EXCEEDED_QUOTA);
            return;
        }
        const signature = await bls_cryptography_client_1.BLSCryptographyClient.computeBlindedSignature(request.body.blindedQueryPhoneNumber);
        await account_1.incrementQueryCount(request.body.account, trx);
        response.json({ success: true, signature });
    }
    catch (error) {
        logger_1.default.error('Failed to getSalt', error);
        if (trx) {
            trx.rollback();
        }
        error_utils_1.respondWithError(response, 500, error_utils_1.ErrorMessages.UNKNOWN_ERROR);
    }
}
exports.handleGetBlindedMessageForSalt = handleGetBlindedMessageForSalt;
function isValidGetSignatureInput(requestBody) {
    return (input_validation_1.hasValidAccountParam(requestBody) &&
        input_validation_1.hasValidQueryPhoneNumberParam(requestBody) &&
        input_validation_1.phoneNumberHashIsValidIfExists(requestBody) &&
        input_validation_1.isBodyReasonablySized(requestBody));
}
//# sourceMappingURL=get-salt.js.map