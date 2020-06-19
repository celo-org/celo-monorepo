"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
var ErrorMessages;
(function (ErrorMessages) {
    ErrorMessages["UNKNOWN_ERROR"] = "CELO_PNP_ERR_00 Something went wrong";
    ErrorMessages["DATABASE_UPDATE_FAILURE"] = "CELO_PNP_ERR_01 Failed to update database entry";
    ErrorMessages["DATABASE_INSERT_FAILURE"] = "CELO_PNP_ERR_02 Failed to insert database entry";
    ErrorMessages["DATABASE_GET_FAILURE"] = "CELO_PNP_ERR_03 Failed to get database entry";
    ErrorMessages["INVALID_INPUT"] = "CELO_PNP_ERR_04 Invalid input paramaters";
    ErrorMessages["EXCEEDED_QUOTA"] = "CELO_PNP_ERR_05 Requester exceeded salt service query quota";
    ErrorMessages["SIGNATURE_COMPUTATION_FAILURE"] = "CELO_PNP_ERR_06 Failed to compute BLS signature";
    ErrorMessages["DUPLICATE_REQUEST_TO_MATCHMAKE"] = "CELO_PNP_ERR_08 Attempt to request >1 matchmaking";
    ErrorMessages["UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE"] = "CELO_PNP_ERR_09 Unverified user attempting to matchmake";
    ErrorMessages["UNAUTHENTICATED_USER"] = "CELO_PNP_ERR_10 Missing or invalid authentication header";
})(ErrorMessages = exports.ErrorMessages || (exports.ErrorMessages = {}));
function respondWithError(res, statusCode, error) {
    logger_1.default.error('Responding with error', error);
    res.status(statusCode).json({ success: false, error });
}
exports.respondWithError = respondWithError;
//# sourceMappingURL=error-utils.js.map