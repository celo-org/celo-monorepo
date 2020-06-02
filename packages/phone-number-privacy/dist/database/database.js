"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
const config_1 = __importStar(require("../config"));
const db = knex_1.default({
    client: 'pg',
    connection: config_1.default.db,
    debug: config_1.DEV_MODE,
});
function getDatabase() {
    return db;
}
exports.getDatabase = getDatabase;
function getTransaction() {
    return db.transaction();
}
exports.getTransaction = getTransaction;
//# sourceMappingURL=database.js.map