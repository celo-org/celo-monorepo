"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var address_1 = require("@celo/utils/lib/address");
var fixidity_1 = require("@celo/utils/lib/fixidity");
var base_1 = require("../base");
var BaseWrapper_1 = require("./BaseWrapper");
var MedianRelation;
(function (MedianRelation) {
    MedianRelation[MedianRelation["Undefined"] = 0] = "Undefined";
    MedianRelation[MedianRelation["Lesser"] = 1] = "Lesser";
    MedianRelation[MedianRelation["Greater"] = 2] = "Greater";
    MedianRelation[MedianRelation["Equal"] = 3] = "Equal";
})(MedianRelation = exports.MedianRelation || (exports.MedianRelation = {}));
/**
 * Currency price oracle contract.
 */
var SortedOraclesWrapper = /** @class */ (function (_super) {
    __extends(SortedOraclesWrapper, _super);
    function SortedOraclesWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Returns the report expiry parameter.
         * @returns Current report expiry.
         */
        _this.reportExpirySeconds = BaseWrapper_1.proxyCall(_this.contract.methods.reportExpirySeconds, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Helper function to get the rates for StableToken, by passing the address
         * of StableToken to `getRates`.
         */
        _this.getStableTokenRates = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.getRates(base_1.CeloContract.StableToken)
                /**
                 * Gets all elements from the doubly linked list.
                 * @param token The CeloToken representing the token for which the Celo
                 *   Gold exchange rate is being reported. Example: CeloContract.StableToken
                 * @return An unpacked list of elements from largest to smallest.
                 */
            ];
        }); }); };
        return _this;
    }
    /**
     * Gets the number of rates that have been reported for the given token
     * @param token The CeloToken token for which the Celo Gold exchange rate is being reported.
     * @return The number of reported oracle rates for `token`.
     */
    SortedOraclesWrapper.prototype.numRates = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [4 /*yield*/, this.contract.methods.numRates(tokenAddress).call()];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.valueToInt(response)];
                }
            });
        });
    };
    /**
     * Returns the median rate for the given token
     * @param token The CeloToken token for which the Celo Gold exchange rate is being reported.
     * @return The median exchange rate for `token`, expressed as:
     *   amount of that token / equivalent amount in Celo Gold
     */
    SortedOraclesWrapper.prototype.medianRate = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [4 /*yield*/, this.contract.methods.medianRate(tokenAddress).call()];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, {
                                rate: BaseWrapper_1.valueToFrac(response[0], response[1]),
                            }];
                }
            });
        });
    };
    /**
     * Checks if the given address is whitelisted as an oracle for the token
     * @param token The CeloToken token
     * @param oracle The address that we're checking the oracle status of
     * @returns boolean describing whether this account is an oracle
     */
    SortedOraclesWrapper.prototype.isOracle = function (token, oracle) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [2 /*return*/, this.contract.methods.isOracle(tokenAddress, oracle).call()];
                }
            });
        });
    };
    /**
     * Returns the list of whitelisted oracles for a given token.
     * @returns The list of whitelisted oracles for a given token.
     */
    SortedOraclesWrapper.prototype.getOracles = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [2 /*return*/, this.contract.methods.getOracles(tokenAddress).call()];
                }
            });
        });
    };
    /**
     * Checks if the oldest report for a given token is expired
     * @param token The token for which to check reports
     */
    SortedOraclesWrapper.prototype.isOldestReportExpired = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [4 /*yield*/, this.contract.methods.isOldestReportExpired(tokenAddress).call()];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    /**
     * Removes expired reports, if any exist
     * @param token The token to remove reports for
     * @param numReports The upper-limit of reports to remove. For example, if there
     * are 2 expired reports, and this param is 5, it will only remove the 2 that
     * are expired.
     */
    SortedOraclesWrapper.prototype.removeExpiredReports = function (token, numReports) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _a.sent();
                        if (!!numReports) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getReports(token)];
                    case 2:
                        numReports = (_a.sent()).length - 1;
                        _a.label = 3;
                    case 3: return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.removeExpiredReports(tokenAddress, numReports))];
                }
            });
        });
    };
    /**
     * Updates an oracle value and the median.
     * @param token The token for which the Celo Gold exchange rate is being reported.
     * @param value The amount of `token` equal to one Celo Gold.
     */
    SortedOraclesWrapper.prototype.report = function (token, value, oracleAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress, fixedValue, _a, lesserKey, greaterKey;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _b.sent();
                        fixedValue = fixidity_1.toFixed(BaseWrapper_1.valueToBigNumber(value));
                        return [4 /*yield*/, this.findLesserAndGreaterKeys(token, BaseWrapper_1.valueToBigNumber(value), oracleAddress)];
                    case 2:
                        _a = _b.sent(), lesserKey = _a.lesserKey, greaterKey = _a.greaterKey;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.report(tokenAddress, fixedValue.toFixed(), lesserKey, greaterKey), { from: oracleAddress })];
                }
            });
        });
    };
    /**
     * Updates an oracle value and the median.
     * @param value The amount of US Dollars equal to one Celo Gold.
     */
    SortedOraclesWrapper.prototype.reportStableToken = function (value, oracleAddress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.report(base_1.CeloContract.StableToken, value, oracleAddress)];
            });
        });
    };
    /**
     * Returns current configuration parameters.
     */
    SortedOraclesWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {};
                        return [4 /*yield*/, this.reportExpirySeconds()];
                    case 1: return [2 /*return*/, (_a.reportExpirySeconds = _b.sent(),
                            _a)];
                }
            });
        });
    };
    /**
     * Gets all elements from the doubly linked list.
     * @param token The CeloToken representing the token for which the Celo
     *   Gold exchange rate is being reported. Example: CeloContract.StableToken
     * @return An unpacked list of elements from largest to smallest.
     */
    SortedOraclesWrapper.prototype.getRates = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress, response, rates, i, medRelIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [4 /*yield*/, this.contract.methods.getRates(tokenAddress).call()];
                    case 2:
                        response = _a.sent();
                        rates = [];
                        for (i = 0; i < response[0].length; i++) {
                            medRelIndex = parseInt(response[2][i], 10);
                            rates.push({
                                address: response[0][i],
                                rate: fixidity_1.fromFixed(BaseWrapper_1.valueToBigNumber(response[1][i])),
                                medianRelation: medRelIndex,
                            });
                        }
                        return [2 /*return*/, rates];
                }
            });
        });
    };
    /**
     * Gets all elements from the doubly linked list.
     * @param token The CeloToken representing the token for which the Celo
     *   Gold exchange rate is being reported. Example: CeloContract.StableToken
     * @return An unpacked list of elements from largest to smallest.
     */
    SortedOraclesWrapper.prototype.getTimestamps = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress, response, timestamps, i, medRelIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(token)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [4 /*yield*/, this.contract.methods.getTimestamps(tokenAddress).call()];
                    case 2:
                        response = _a.sent();
                        timestamps = [];
                        for (i = 0; i < response[0].length; i++) {
                            medRelIndex = parseInt(response[2][i], 10);
                            timestamps.push({
                                address: response[0][i],
                                timestamp: BaseWrapper_1.valueToBigNumber(response[1][i]),
                                medianRelation: medRelIndex,
                            });
                        }
                        return [2 /*return*/, timestamps];
                }
            });
        });
    };
    SortedOraclesWrapper.prototype.getReports = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, rates, timestamps, reports, _loop_1, _i, rates_1, rate;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([this.getRates(token), this.getTimestamps(token)])];
                    case 1:
                        _a = _b.sent(), rates = _a[0], timestamps = _a[1];
                        reports = [];
                        _loop_1 = function (rate) {
                            var match = timestamps.filter(function (t) { return address_1.eqAddress(t.address, rate.address); });
                            reports.push({ address: rate.address, rate: rate.rate, timestamp: match[0].timestamp });
                        };
                        for (_i = 0, rates_1 = rates; _i < rates_1.length; _i++) {
                            rate = rates_1[_i];
                            _loop_1(rate);
                        }
                        return [2 /*return*/, reports];
                }
            });
        });
    };
    SortedOraclesWrapper.prototype.findLesserAndGreaterKeys = function (token, value, oracleAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var currentRates, greaterKey, lesserKey, _i, currentRates_1, rate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRates(token)];
                    case 1:
                        currentRates = _a.sent();
                        greaterKey = base_1.NULL_ADDRESS;
                        lesserKey = base_1.NULL_ADDRESS;
                        // This leverages the fact that the currentRates are already sorted from
                        // greatest to lowest value
                        for (_i = 0, currentRates_1 = currentRates; _i < currentRates_1.length; _i++) {
                            rate = currentRates_1[_i];
                            if (!address_1.eqAddress(rate.address, oracleAddress)) {
                                if (rate.rate.isLessThanOrEqualTo(value)) {
                                    lesserKey = rate.address;
                                    break;
                                }
                                greaterKey = rate.address;
                            }
                        }
                        return [2 /*return*/, { lesserKey: lesserKey, greaterKey: greaterKey }];
                }
            });
        });
    };
    return SortedOraclesWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.SortedOraclesWrapper = SortedOraclesWrapper;
//# sourceMappingURL=SortedOracles.js.map