"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_utils_1 = require("../common/error-utils");
const identity_1 = require("../common/identity");
const input_validation_1 = require("../common/input-validation");
const logger_1 = __importDefault(require("../common/logger"));
const account_1 = require("../database/wrappers/account");
const number_pairs_1 = require("../database/wrappers/number-pairs");
// TODO (amyslawson) consider pagination or streaming of contacts?
async function handleGetContactMatches(request, response) {
    try {
        if (!isValidGetContactMatchesInput(request.body)) {
            error_utils_1.respondWithError(response, 400, error_utils_1.ErrorMessages.INVALID_INPUT);
            return;
        }
        if (!identity_1.authenticateUser(request)) {
            error_utils_1.respondWithError(response, 401, error_utils_1.ErrorMessages.UNAUTHENTICATED_USER);
            return;
        }
        if (!(await identity_1.isVerified(request.body.account, request.body.userPhoneNumber))) {
            error_utils_1.respondWithError(response, 403, error_utils_1.ErrorMessages.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE);
            return;
        }
        if (await account_1.getDidMatchmaking(request.body.account)) {
            error_utils_1.respondWithError(response, 403, error_utils_1.ErrorMessages.DUPLICATE_REQUEST_TO_MATCHMAKE);
            return;
        }
        const matchedContacts = (await number_pairs_1.getNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)).map((numberPair) => ({ phoneNumber: numberPair }));
        await number_pairs_1.setNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers);
        await account_1.setDidMatchmaking(request.body.account);
        response.json({ success: true, matchedContacts });
    }
    catch (e) {
        logger_1.default.error('Failed to getContactMatches', e);
        error_utils_1.respondWithError(response, 500, error_utils_1.ErrorMessages.UNKNOWN_ERROR);
    }
}
exports.handleGetContactMatches = handleGetContactMatches;
function isValidGetContactMatchesInput(requestBody) {
    return (input_validation_1.hasValidAccountParam(requestBody) &&
        input_validation_1.hasValidUserPhoneNumberParam(requestBody) &&
        input_validation_1.hasValidContractPhoneNumbersParam(requestBody) &&
        input_validation_1.isBodyReasonablySized(requestBody));
}
//# sourceMappingURL=get-contact-matches.js.map