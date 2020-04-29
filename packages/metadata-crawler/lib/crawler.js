"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var identity_1 = require("@celo/contractkit/lib/identity");
var verify_1 = require("@celo/contractkit/lib/identity/claims/verify");
var address_1 = require("@celo/utils/lib/address");
var claim_1 = require("@celo/contractkit/lib/identity/claims/claim");
var contractkit_1 = require("@celo/contractkit");
var logger_1 = require("./logger");
var PGUSER = process.env['PGUSER'] || 'postgres';
var PGPASSWORD = process.env['PGPASSWORD'] || '';
var PGHOST = process.env['PGHOST'] || '127.0.0.1';
var PGPORT = process.env['PGPORT'] || '5432';
var PGDATABASE = process.env['PGDATABASE'] || 'blockscout';
var PROVIDER_URL = process.env['PROVIDER_URL'] || 'http://localhost:8545';
var client = new pg_1.Client({
    user: PGUSER,
    password: PGPASSWORD,
    host: PGHOST,
    port: Number(PGPORT),
    database: PGDATABASE,
});
var kit = contractkit_1.newKit(PROVIDER_URL);
function jsonQuery(query) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.query("SELECT json_agg(t) FROM (" + query + ") t")];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.rows[0].json_agg];
            }
        });
    });
}
function createVerificationClaims(address, domain, verified, accounts) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, addDatabaseVerificationClaims(address, domain, verified)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Promise.all(accounts.map(function (account) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, addDatabaseVerificationClaims(account.address.replace('0x', ''), domain, verified)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function addDatabaseVerificationClaims(address, domain, verified) {
    return __awaiter(this, void 0, void 0, function () {
        var query_1, values, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    query_1 = "INSERT INTO celo_claims (address, type, element, verified, timestamp, inserted_at, updated_at) VALUES \n        (decode($1, 'hex'), 'domain', $2, $3, now(), now(), now()) \n        ON CONFLICT (address, type, element) DO \n        UPDATE SET verified=$3, timestamp=now(), updated_at=now() ";
                    values = [address, domain, verified];
                    return [4 /*yield*/, client
                            .query(query_1, values)
                            .catch(function (error) { return logger_1.logger.error('Database error %s, query: %s', error, query_1); })
                            .then(function () {
                            return logger_1.logger.info('Verification flag added to domain %s and address %s', domain, address);
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    logger_1.logger.error('Error updating the database', err_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function handleItem(item) {
    return __awaiter(this, void 0, void 0, function () {
        var metadata, claims, unverifiedAccounts, accountVerification, accounts_1, err_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, identity_1.IdentityMetadataWrapper.fetchFromURL(kit, item.url)];
                case 1:
                    metadata = _a.sent();
                    claims = metadata.filterClaims(identity_1.ClaimTypes.DOMAIN);
                    unverifiedAccounts = metadata.filterClaims(identity_1.ClaimTypes.ACCOUNT);
                    return [4 /*yield*/, Promise.all(unverifiedAccounts.map(function (claim) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = {
                                            claim: claim
                                        };
                                        return [4 /*yield*/, verify_1.verifyAccountClaim(kit, claim, item.address)];
                                    case 1: return [2 /*return*/, (_a.verified = _b.sent(),
                                            _a)];
                                }
                            });
                        }); }))];
                case 2:
                    accountVerification = _a.sent();
                    accounts_1 = accountVerification
                        .filter(function (_a) {
                        var verified = _a.verified;
                        return verified === undefined;
                    })
                        .map(function (a) { return a.claim; });
                    return [4 /*yield*/, Promise.all(claims.map(function (claim) { return __awaiter(_this, void 0, void 0, function () {
                            var addressWith0x, verificationStatus;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        addressWith0x = '0x' + item.address;
                                        logger_1.logger.debug('Claim: %s', claim_1.serializeClaim(claim));
                                        logger_1.logger.debug('Accounts: %s', JSON.stringify(accounts_1));
                                        logger_1.logger.debug('Verifying %s for address %s', claim.domain, addressWith0x);
                                        return [4 /*yield*/, verify_1.verifyDomainRecord(kit, claim, addressWith0x).catch(function (error) { return logger_1.logger.error('Error in verifyDomainClaim %s', error); })];
                                    case 1:
                                        verificationStatus = _a.sent();
                                        if (!(verificationStatus === undefined)) return [3 /*break*/, 3];
                                        // If undefined means the claim was verified successfully
                                        return [4 /*yield*/, createVerificationClaims(item.address, claim.domain, true, accounts_1)];
                                    case 2:
                                        // If undefined means the claim was verified successfully
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        logger_1.logger.debug(verificationStatus);
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _a.sent();
                    logger_1.logger.error('Cannot read metadata %s', err_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var items;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1.logger.info('Connecting DB: %s', PGHOST);
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _a.sent();
                    client.on('error', function (error) {
                        logger_1.logger.debug('Reconnecting after %s', error);
                        client.connect();
                    });
                    return [4 /*yield*/, jsonQuery("SELECT address, url FROM celo_account WHERE url is NOT NULL ")];
                case 2:
                    items = _a.sent();
                    items = items || [];
                    items = items.map(function (a) { return (__assign(__assign({}, a), { address: address_1.normalizeAddress(a.address.substr(2)) })); });
                    return [4 /*yield*/, Promise.all(items.map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, handleItem(item)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))
                            .then(function () {
                            logger_1.logger.info('Closing DB connecting and finishing');
                            client.end();
                            process.exit(0);
                        })
                            .catch(function (error) {
                            logger_1.logger.error('Error: %s', error);
                            client.end();
                            process.exit(1);
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    logger_1.logger.error({ err: err });
    process.exit(1);
});
//# sourceMappingURL=crawler.js.map