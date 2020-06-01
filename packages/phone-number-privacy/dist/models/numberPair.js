"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
exports.NUMBER_PAIRS_TABLE = 'number_pairs';
var NUMBER_PAIRS_COLUMN;
(function (NUMBER_PAIRS_COLUMN) {
    NUMBER_PAIRS_COLUMN["userPhoneHash"] = "user_phone_hash";
    NUMBER_PAIRS_COLUMN["contactPhoneHash"] = "contact_phone_hash";
})(NUMBER_PAIRS_COLUMN = exports.NUMBER_PAIRS_COLUMN || (exports.NUMBER_PAIRS_COLUMN = {}));
class NumberPair extends model_1.Model {
    constructor(userPhoneHash, contactPhoneHash) {
        super();
        this.userPhoneHash = userPhoneHash;
        this.contactPhoneHash = contactPhoneHash;
    }
}
exports.NumberPair = NumberPair;
//# sourceMappingURL=numberPair.js.map