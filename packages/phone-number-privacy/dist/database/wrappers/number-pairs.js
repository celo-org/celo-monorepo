"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_utils_1 = require("../../common/error-utils");
const logger_1 = __importDefault(require("../../common/logger"));
const database_1 = require("../database");
const numberPair_1 = require("../models/numberPair");
function numberPairs() {
    return database_1.getDatabase()(numberPair_1.NUMBER_PAIRS_TABLE);
}
/*
 * Returns contacts who have already matched with the user (a contact-->user mapping exists).
 */
async function getNumberPairContacts(userPhone, contactPhones) {
    try {
        const contentPairs = await numberPairs()
            .select(numberPair_1.NUMBER_PAIRS_COLUMN.userPhoneHash)
            .where(numberPair_1.NUMBER_PAIRS_COLUMN.contactPhoneHash, userPhone);
        const contactPhonesSet = new Set(contactPhones);
        return contentPairs
            .map((contactPair) => contactPair[numberPair_1.NUMBER_PAIRS_COLUMN.userPhoneHash])
            .filter((number) => contactPhonesSet.has(number));
    }
    catch (e) {
        logger_1.default.error(error_utils_1.ErrorMessages.DATABASE_GET_FAILURE, e);
        return [];
    }
}
exports.getNumberPairContacts = getNumberPairContacts;
/*
 * Add record for user-->contact mapping,
 */
async function setNumberPairContacts(userPhone, contactPhones) {
    const rows = [];
    for (const contactPhone of contactPhones) {
        const data = new numberPair_1.NumberPair(userPhone, contactPhone);
        rows.push(data);
    }
    try {
        await database_1.getDatabase().batchInsert(numberPair_1.NUMBER_PAIRS_TABLE, rows);
    }
    catch (e) {
        // ignore duplicate insertion error (23505)
        if (e.code !== '23505') {
            logger_1.default.error(error_utils_1.ErrorMessages.DATABASE_INSERT_FAILURE, e);
        }
    }
}
exports.setNumberPairContacts = setNumberPairContacts;
//# sourceMappingURL=number-pairs.js.map