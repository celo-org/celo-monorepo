"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_utils_1 = require("../../common/error-utils");
const logger_1 = __importDefault(require("../../common/logger"));
const database_1 = require("../database");
const account_1 = require("../models/account");
function accounts() {
    return database_1.getDatabase()(account_1.ACCOUNTS_TABLE);
}
/*
 * Returns how many queries the account has already performed.
 */
async function getPerformedQueryCount(account, trx) {
    logger_1.default.debug('Getting performed query count');
    try {
        const queryCounts = await trx(account_1.ACCOUNTS_TABLE)
            .forUpdate()
            .select(account_1.ACCOUNTS_COLUMNS.numLookups)
            .where(account_1.ACCOUNTS_COLUMNS.address, account)
            .first();
        return queryCounts === undefined ? 0 : queryCounts[account_1.ACCOUNTS_COLUMNS.numLookups];
    }
    catch (e) {
        logger_1.default.error(error_utils_1.ErrorMessages.DATABASE_GET_FAILURE, e);
        return 0;
    }
}
exports.getPerformedQueryCount = getPerformedQueryCount;
async function getAccountExists(account) {
    const existingAccountRecord = await accounts()
        .where(account_1.ACCOUNTS_COLUMNS.address, account)
        .first();
    return !!existingAccountRecord;
}
/*
 * Increments query count in database.  If record doesn't exist, create one.
 */
async function incrementQueryCount(account, trx) {
    logger_1.default.debug('Incrementing query count');
    try {
        if (await getAccountExists(account)) {
            await trx(account_1.ACCOUNTS_TABLE)
                .where(account_1.ACCOUNTS_COLUMNS.address, account)
                .increment(account_1.ACCOUNTS_COLUMNS.numLookups, 1);
        }
        else {
            const newAccount = new account_1.Account(account);
            newAccount[account_1.ACCOUNTS_COLUMNS.numLookups] = 1;
            return insertRecord(newAccount);
        }
        await trx.commit();
    }
    catch (e) {
        logger_1.default.error(error_utils_1.ErrorMessages.DATABASE_UPDATE_FAILURE, e);
        await trx.commit(); // don't rollback with DB failure. commit to release lock
        return true;
    }
}
exports.incrementQueryCount = incrementQueryCount;
/*
 * Returns whether account has already performed matchmaking
 */
async function getDidMatchmaking(account) {
    try {
        const didMatchmaking = await accounts()
            .where(account_1.ACCOUNTS_COLUMNS.address, account)
            .select(account_1.ACCOUNTS_COLUMNS.didMatchmaking)
            .first();
        if (!didMatchmaking) {
            return false;
        }
        return !!didMatchmaking[account_1.ACCOUNTS_COLUMNS.didMatchmaking];
    }
    catch (e) {
        logger_1.default.error(error_utils_1.ErrorMessages.DATABASE_GET_FAILURE, e);
        return false;
    }
}
exports.getDidMatchmaking = getDidMatchmaking;
/*
 * Set did matchmaking to true in database.  If record doesn't exist, create one.
 */
async function setDidMatchmaking(account) {
    logger_1.default.debug('Setting did matchmaking');
    try {
        if (await getAccountExists(account)) {
            return accounts()
                .where(account_1.ACCOUNTS_COLUMNS.address, account)
                .update(account_1.ACCOUNTS_COLUMNS.didMatchmaking, new Date());
        }
        else {
            const newAccount = new account_1.Account(account);
            newAccount[account_1.ACCOUNTS_COLUMNS.didMatchmaking] = new Date();
            return insertRecord(newAccount);
        }
    }
    catch (e) {
        logger_1.default.error(error_utils_1.ErrorMessages.DATABASE_UPDATE_FAILURE, e);
        return true;
    }
}
exports.setDidMatchmaking = setDidMatchmaking;
async function insertRecord(data) {
    try {
        await accounts()
            .insert(data)
            .timeout(10000);
    }
    catch (e) {
        logger_1.default.error(error_utils_1.ErrorMessages.DATABASE_INSERT_FAILURE, e);
    }
    return true;
}
//# sourceMappingURL=account.js.map