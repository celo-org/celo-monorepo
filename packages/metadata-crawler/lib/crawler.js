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
var contractkit_1 = require("@celo/contractkit");
var identity_1 = require("@celo/contractkit/lib/identity");
var verify_1 = require("@celo/contractkit/lib/identity/claims/verify");
var address_1 = require("@celo/utils/lib/address");
var async_1 = require("@celo/utils/lib/async");
var pg_1 = require("pg");
var logger_1 = require("./logger");
var CONCURRENCY = 10;
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
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, addDatabaseVerificationClaims(address, domain, verified)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, async_1.concurrentMap(CONCURRENCY, accounts, function (account) {
                            return addDatabaseVerificationClaims(account, domain, verified);
                        })];
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
                    query_1 = "INSERT INTO celo_claims (address, type, element, verified, timestamp, inserted_at, updated_at) VALUES\n        (decode($1, 'hex'), 'domain', $2, $3, now(), now(), now())\n        ON CONFLICT (address, type, element) DO\n        UPDATE SET verified=$3, timestamp=now(), updated_at=now() ";
                    values = [address_1.trimLeading0x(address), domain, verified];
                    return [4 /*yield*/, client
                            .query(query_1, values)
                            .catch(function (err) { return logger_1.logger.error({ err: err, query: query_1 }, 'addDataBaseVerificationClaims error'); })
                            .then(function () { return logger_1.dataLogger.info({ domain: domain, address: address }, 'VERIFIED_DOMAIN_CLAIM'); })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    logger_1.logger.error({ err: err_1 }, 'addDataBaseVerificationClaims error');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getVerifiedAccounts(metadata, address) {
    return __awaiter(this, void 0, void 0, function () {
        var unverifiedAccounts, accountVerification, accounts;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    unverifiedAccounts = metadata.filterClaims(identity_1.ClaimTypes.ACCOUNT);
                    return [4 /*yield*/, Promise.all(unverifiedAccounts.map(function (claim) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = {
                                            claim: claim
                                        };
                                        return [4 /*yield*/, verify_1.verifyAccountClaim(kit, claim, address)];
                                    case 1: return [2 /*return*/, (_a.verified = _b.sent(),
                                            _a)];
                                }
                            });
                        }); }))];
                case 1:
                    accountVerification = _a.sent();
                    accounts = accountVerification
                        .filter(function (_a) {
                        var verified = _a.verified;
                        return verified === undefined;
                    })
                        .map(function (a) { return a.claim.address; });
                    return [2 /*return*/, accounts];
            }
        });
    });
}
function getVerifiedDomains(metadata, address, logger) {
    return __awaiter(this, void 0, void 0, function () {
        var unverifiedDomains, domainVerification, domains;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    unverifiedDomains = metadata.filterClaims(identity_1.ClaimTypes.DOMAIN);
                    return [4 /*yield*/, async_1.concurrentMap(CONCURRENCY, unverifiedDomains, function (claim) { return __awaiter(_this, void 0, void 0, function () {
                            var verificationStatus, err_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, verify_1.verifyDomainRecord(kit, claim, address)];
                                    case 1:
                                        verificationStatus = _a.sent();
                                        logger.debug({ claim: claim, verificationStatus: verificationStatus }, "verified_domain");
                                        return [2 /*return*/, {
                                                claim: claim,
                                                verified: verificationStatus === undefined,
                                            }];
                                    case 2:
                                        err_2 = _a.sent();
                                        logger.error({ err: err_2, claim: claim });
                                        return [2 /*return*/, {
                                                claim: claim,
                                                verified: false,
                                            }];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    domainVerification = _a.sent();
                    domains = domainVerification.filter(function (_a) {
                        var verified = _a.verified;
                        return verified;
                    }).map(function (_) { return _.claim.domain; });
                    return [2 /*return*/, domains];
            }
        });
    });
}
function processDomainClaimForValidator(item) {
    return __awaiter(this, void 0, void 0, function () {
        var itemLogger, metadata, verifiedAccounts_1, verifiedDomains, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    itemLogger = logger_1.operationalLogger.child({ url: item.url, address: item.address });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    itemLogger.debug('fetch_metadata');
                    return [4 /*yield*/, identity_1.IdentityMetadataWrapper.fetchFromURL(kit, item.url)];
                case 2:
                    metadata = _a.sent();
                    return [4 /*yield*/, getVerifiedAccounts(metadata, item.address)];
                case 3:
                    verifiedAccounts_1 = _a.sent();
                    return [4 /*yield*/, getVerifiedDomains(metadata, item.address, itemLogger)];
                case 4:
                    verifiedDomains = _a.sent();
                    return [4 /*yield*/, async_1.concurrentMap(CONCURRENCY, verifiedDomains, function (domain) {
                            return createVerificationClaims(item.address, domain, true, verifiedAccounts_1);
                        })];
                case 5:
                    _a.sent();
                    itemLogger.debug({
                        verfiedAccountClaims: verifiedAccounts_1.length,
                        verifiedDomainClaims: verifiedDomains.length,
                    }, 'processDomainClaimForValidator done');
                    return [3 /*break*/, 7];
                case 6:
                    err_3 = _a.sent();
                    itemLogger.error({ err: err_3 }, 'processDomainClaimForValidator error');
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function processDomainClaims() {
    return __awaiter(this, void 0, void 0, function () {
        var items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, jsonQuery("SELECT address, url FROM celo_account WHERE url is NOT NULL ")];
                case 1:
                    items = _a.sent();
                    logger_1.operationalLogger.debug({ length: items.length }, 'fetching all accounts');
                    items = items || [];
                    items = items.map(function (a) { return (__assign(__assign({}, a), { 
                        // Addresses are stored by blockscout as just the bytes prepended with \x
                        address: address_1.normalizeAddressWith0x(a.address.substr(2)) })); });
                    return [2 /*return*/, async_1.concurrentMap(CONCURRENCY, items, function (item) { return processDomainClaimForValidator(item); })
                            .then(function () {
                            logger_1.operationalLogger.info('Closing DB connecting and finishing');
                        })
                            .catch(function (err) {
                            logger_1.operationalLogger.error({ err: err }, 'processDomainClaimForValidator error');
                            client.end();
                            process.exit(1);
                        })];
            }
        });
    });
}
function processAttestationServiceStatusForValidator(electedValidators, attestationsWrapper, validator) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, name, smsProviders, address, affiliation, attestationServiceURL, metadataURL, attestationSigner, blacklistedRegionCodes, rightAccount, error, state, isElected;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, attestationsWrapper.getAttestationServiceStatus(validator)];
                case 1:
                    _a = _b.sent(), name = _a.name, smsProviders = _a.smsProviders, address = _a.address, affiliation = _a.affiliation, attestationServiceURL = _a.attestationServiceURL, metadataURL = _a.metadataURL, attestationSigner = _a.attestationSigner, blacklistedRegionCodes = _a.blacklistedRegionCodes, rightAccount = _a.rightAccount, error = _a.error, state = _a.state;
                    isElected = electedValidators.has(validator.address);
                    logger_1.dataLogger.info({
                        name: name,
                        isElected: isElected,
                        smsProviders: smsProviders,
                        address: address,
                        group: affiliation,
                        attestationServiceURL: attestationServiceURL,
                        metadataURL: metadataURL,
                        attestationSigner: attestationSigner,
                        blacklistedRegionCodes: blacklistedRegionCodes,
                        rightAccount: rightAccount,
                        err: error,
                        state: state,
                    }, 'checked_attestation_service_status');
                    return [2 /*return*/];
            }
        });
    });
}
function processAttestationServices() {
    return __awaiter(this, void 0, void 0, function () {
        var validatorsWrapper, electionsWrapper, attestationsWrapper, validators, currentEpoch, _a, _b, electedValidators, electedValidatorsSet;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    logger_1.operationalLogger.debug('processAttestationServices start');
                    return [4 /*yield*/, kit.contracts.getValidators()];
                case 1:
                    validatorsWrapper = _c.sent();
                    return [4 /*yield*/, kit.contracts.getElection()];
                case 2:
                    electionsWrapper = _c.sent();
                    return [4 /*yield*/, kit.contracts.getAttestations()];
                case 3:
                    attestationsWrapper = _c.sent();
                    return [4 /*yield*/, validatorsWrapper.getRegisteredValidators()];
                case 4:
                    validators = _c.sent();
                    _b = (_a = kit).getEpochNumberOfBlock;
                    return [4 /*yield*/, kit.web3.eth.getBlockNumber()];
                case 5: return [4 /*yield*/, _b.apply(_a, [_c.sent()])];
                case 6:
                    currentEpoch = _c.sent();
                    return [4 /*yield*/, electionsWrapper.getElectedValidators(currentEpoch)];
                case 7:
                    electedValidators = _c.sent();
                    electedValidatorsSet = new Set();
                    electedValidators.forEach(function (validator) { return electedValidatorsSet.add(validator.address); });
                    return [4 /*yield*/, async_1.concurrentMap(CONCURRENCY, validators, function (validator) {
                            return processAttestationServiceStatusForValidator(electedValidatorsSet, attestationsWrapper, validator);
                        })];
                case 8:
                    _c.sent();
                    logger_1.operationalLogger.debug('processAttestationServices finish');
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1.operationalLogger.info({ host: PGHOST }, 'Connecting DB');
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _a.sent();
                    client.on('error', function (err) {
                        logger_1.operationalLogger.error({ err: err }, 'Reconnecting after error');
                        client.connect();
                    });
                    return [4 /*yield*/, processDomainClaims()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, processAttestationServices()];
                case 3:
                    _a.sent();
                    client.end();
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    logger_1.operationalLogger.error({ err: err });
    process.exit(1);
});
//# sourceMappingURL=crawler.js.map