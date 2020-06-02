"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
exports.ACCOUNTS_TABLE = 'accounts';
var ACCOUNTS_COLUMNS;
(function (ACCOUNTS_COLUMNS) {
    ACCOUNTS_COLUMNS["address"] = "address";
    ACCOUNTS_COLUMNS["createdAt"] = "created_at";
    ACCOUNTS_COLUMNS["numLookups"] = "num_lookups";
    ACCOUNTS_COLUMNS["didMatchmaking"] = "did_matchmaking";
})(ACCOUNTS_COLUMNS = exports.ACCOUNTS_COLUMNS || (exports.ACCOUNTS_COLUMNS = {}));
class Account extends model_1.Model {
    constructor(address) {
        super();
        this.createdAt = Date.now();
        this.numLookups = 0;
        this.didMatchmaking = null;
        // TODO validate address
        this.address = address;
    }
}
exports.Account = Account;
//# sourceMappingURL=account.js.map