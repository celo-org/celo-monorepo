"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const identity_1 = require("../common/identity");
const logger_1 = __importDefault(require("../common/logger"));
const config_1 = __importDefault(require("../config"));
const account_1 = require("../database/wrappers/account");
const contracts_1 = require("../web3/contracts");
/*
 * Returns how many queries the account can make based on the
 * calculated query quota and the number of queries already performed.
 */
async function getRemainingQueryCount(trx, account, hashedPhoneNumber) {
    logger_1.default.debug('Retrieving remaining query count');
    const queryQuota = await getQueryQuota(account, hashedPhoneNumber);
    const performedQueryCount = await account_1.getPerformedQueryCount(account, trx);
    return queryQuota - performedQueryCount;
}
exports.getRemainingQueryCount = getRemainingQueryCount;
/*
 * Calculates how many queries the caller has unlocked based on the algorithm
 * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
 * If the caller is not verified, they must have a minimum balance to get the unverifiedQueryMax.
 */
async function getQueryQuota(account, hashedPhoneNumber) {
    if (hashedPhoneNumber && (await identity_1.isVerified(account, hashedPhoneNumber))) {
        logger_1.default.debug('Account is verified');
        const transactionCount = await getTransactionCountFromAccount(account);
        return (config_1.default.salt.unverifiedQueryMax +
            config_1.default.salt.additionalVerifiedQueryMax +
            config_1.default.salt.queryPerTransaction * transactionCount);
    }
    const accountBalance = await getDollarBalance(account);
    if (accountBalance.isGreaterThanOrEqualTo(config_1.default.salt.minDollarBalance)) {
        logger_1.default.debug('Account is not verified but meets min balance');
        // TODO consider granting these unverified users slightly less queryPerTx
        const transactionCount = await getTransactionCountFromAccount(account);
        return config_1.default.salt.unverifiedQueryMax + config_1.default.salt.queryPerTransaction * transactionCount;
    }
    logger_1.default.debug('Account does not meet query quota criteria');
    return 0;
}
async function getTransactionCountFromAccount(account) {
    // TODO (amyslawson) wrap forno request in retry
    return contracts_1.getContractKit().web3.eth.getTransactionCount(account);
}
async function getDollarBalance(account) {
    const stableTokenWrapper = await contracts_1.getContractKit().contracts.getStableToken();
    return stableTokenWrapper.balanceOf(account);
}
//# sourceMappingURL=query-quota.js.map