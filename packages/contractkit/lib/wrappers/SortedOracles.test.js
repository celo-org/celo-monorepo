"use strict";
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
var ganache_test_1 = require("@celo/dev-utils/lib/ganache-test");
var base_1 = require("../base");
var kit_1 = require("../kit");
// set timeout to 10 seconds
jest.setTimeout(10 * 1000);
/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/
ganache_test_1.testWithGanache('SortedOracles Wrapper', function (web3) {
    // NOTE: These values are set in test-utils/network-config.json, and are derived
    // from the MNEMONIC. If the MNEMONIC has changed, these will need to be reset.
    // To do that, look at the output of web3.eth.getAccounts(), and pick a few
    // addresses from that set to be oracles
    var stableTokenOracles = ganache_test_1.NetworkConfig.stableToken.oracles;
    var oracleAddress = stableTokenOracles[stableTokenOracles.length - 1];
    var kit = kit_1.newKitFromWeb3(web3);
    var allAccounts;
    var sortedOracles;
    var stableTokenAddress;
    var nonOracleAddress;
    function reportAsOracles(oracles, rates) {
        if (rates === void 0) { rates = []; }
        return __awaiter(this, void 0, void 0, function () {
            var _i, oracles_1, _oracle, i, tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Create some arbitrary values to report if none were passed in
                        if (rates.length === 0) {
                            for (_i = 0, oracles_1 = oracles; _i < oracles_1.length; _i++) {
                                _oracle = oracles_1[_i];
                                rates.push(Math.random() * 2);
                            }
                        }
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < rates.length)) return [3 /*break*/, 5];
                        return [4 /*yield*/, sortedOracles.report(base_1.CeloContract.StableToken, rates[i], oracles[i])];
                    case 2:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.sendAndWaitForReceipt()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    // Quick setup for conditions when some oracle reports are expired and the rest are not.
    // This assumes that the rates reported can be arbitrary and not a critical piece of the test.
    function setupExpiredAndNotExpiredReports(expiredOracles) {
        return __awaiter(this, void 0, void 0, function () {
            var expirySeconds, freshOracles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sortedOracles.reportExpirySeconds()];
                    case 1:
                        expirySeconds = (_a.sent()).toNumber();
                        return [4 /*yield*/, reportAsOracles(expiredOracles)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, ganache_test_1.timeTravel(expirySeconds + 5, web3)];
                    case 3:
                        _a.sent();
                        freshOracles = stableTokenOracles.filter(function (o) { return !expiredOracles.includes(o); });
                        return [4 /*yield*/, reportAsOracles(freshOracles)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, kit.contracts.getSortedOracles()];
                case 1:
                    sortedOracles = _a.sent();
                    return [4 /*yield*/, kit.registry.addressFor(base_1.CeloContract.StableToken)];
                case 2:
                    stableTokenAddress = _a.sent();
                    return [4 /*yield*/, web3.eth.getAccounts()];
                case 3:
                    allAccounts = _a.sent();
                    nonOracleAddress = allAccounts.find(function (addr) {
                        return !stableTokenOracles.includes(addr);
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    describe('#report', function () {
        var value = 16;
        describe('when reporting from a whitelisted Oracle', function () {
            it('should be able to report a rate', function () { return __awaiter(void 0, void 0, void 0, function () {
                var initialRates, tx, resultingRates;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, sortedOracles.getRates(base_1.CeloContract.StableToken)];
                        case 1:
                            initialRates = _a.sent();
                            return [4 /*yield*/, sortedOracles.report(base_1.CeloContract.StableToken, value, oracleAddress)];
                        case 2:
                            tx = _a.sent();
                            return [4 /*yield*/, tx.sendAndWaitForReceipt()];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, sortedOracles.getRates(base_1.CeloContract.StableToken)];
                        case 4:
                            resultingRates = _a.sent();
                            expect(resultingRates).not.toMatchObject(initialRates);
                            return [2 /*return*/];
                    }
                });
            }); });
            describe('when inserting into the middle of the existing rates', function () {
                beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var rates;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                rates = [15, 20, 17];
                                return [4 /*yield*/, reportAsOracles(stableTokenOracles, rates)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                var expectedLesserKey = stableTokenOracles[0];
                var expectedGreaterKey = stableTokenOracles[2];
                var expectedOracleOrder = [
                    stableTokenOracles[1],
                    stableTokenOracles[2],
                    oracleAddress,
                    stableTokenOracles[0],
                ];
                it('passes the correct lesserKey and greaterKey as args', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var tx, actualArgs;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sortedOracles.report(base_1.CeloContract.StableToken, value, oracleAddress)];
                            case 1:
                                tx = _a.sent();
                                actualArgs = tx.txo.arguments;
                                expect(actualArgs[2]).toEqual(expectedLesserKey);
                                expect(actualArgs[3]).toEqual(expectedGreaterKey);
                                return [4 /*yield*/, tx.sendAndWaitForReceipt()];
                            case 2:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('inserts the new record in the right place', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var tx, resultingRates;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sortedOracles.report(base_1.CeloContract.StableToken, value, oracleAddress)];
                            case 1:
                                tx = _a.sent();
                                return [4 /*yield*/, tx.sendAndWaitForReceipt()];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, sortedOracles.getRates(base_1.CeloContract.StableToken)];
                            case 3:
                                resultingRates = _a.sent();
                                expect(resultingRates.map(function (r) { return r.address; })).toEqual(expectedOracleOrder);
                                return [2 /*return*/];
                        }
                    });
                }); });
            });
        });
        describe('when reporting from a non-oracle address', function () {
            it('should raise an error', function () { return __awaiter(void 0, void 0, void 0, function () {
                var tx;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, sortedOracles.report(base_1.CeloContract.StableToken, value, nonOracleAddress)];
                        case 1:
                            tx = _a.sent();
                            return [4 /*yield*/, expect(tx.sendAndWaitForReceipt()).rejects.toThrow('sender was not an oracle')];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should not change the list of rates', function () { return __awaiter(void 0, void 0, void 0, function () {
                var initialRates, tx, err_1, resultingRates;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, sortedOracles.getRates(base_1.CeloContract.StableToken)];
                        case 1:
                            initialRates = _a.sent();
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 5, 6, 8]);
                            return [4 /*yield*/, sortedOracles.report(base_1.CeloContract.StableToken, value, nonOracleAddress)];
                        case 3:
                            tx = _a.sent();
                            return [4 /*yield*/, tx.sendAndWaitForReceipt()];
                        case 4:
                            _a.sent();
                            return [3 /*break*/, 8];
                        case 5:
                            err_1 = _a.sent();
                            return [3 /*break*/, 8];
                        case 6: return [4 /*yield*/, sortedOracles.getRates(base_1.CeloContract.StableToken)];
                        case 7:
                            resultingRates = _a.sent();
                            expect(resultingRates).toMatchObject(initialRates);
                            return [7 /*endfinally*/];
                        case 8: return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    describe('#removeExpiredReports', function () {
        describe('when expired reports exist', function () {
            var expiredOracles = stableTokenOracles.slice(0, 2);
            var initialReportCount;
            beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, setupExpiredAndNotExpiredReports(expiredOracles)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, sortedOracles.numRates(base_1.CeloContract.StableToken)];
                        case 2:
                            initialReportCount = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should successfully remove a report', function () { return __awaiter(void 0, void 0, void 0, function () {
                var tx, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, sortedOracles.removeExpiredReports(base_1.CeloContract.StableToken, 1)];
                        case 1:
                            tx = _b.sent();
                            return [4 /*yield*/, tx.sendAndWaitForReceipt({ from: oracleAddress })];
                        case 2:
                            _b.sent();
                            _a = expect;
                            return [4 /*yield*/, sortedOracles.numRates(base_1.CeloContract.StableToken)];
                        case 3:
                            _a.apply(void 0, [_b.sent()]).toEqual(initialReportCount - 1);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('removes only the expired reports, even if the number to remove is higher', function () { return __awaiter(void 0, void 0, void 0, function () {
                var toRemove, tx, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            toRemove = expiredOracles.length + 1;
                            return [4 /*yield*/, sortedOracles.removeExpiredReports(base_1.CeloContract.StableToken, toRemove)];
                        case 1:
                            tx = _b.sent();
                            return [4 /*yield*/, tx.sendAndWaitForReceipt({ from: oracleAddress })];
                        case 2:
                            _b.sent();
                            _a = expect;
                            return [4 /*yield*/, sortedOracles.numRates(base_1.CeloContract.StableToken)];
                        case 3:
                            _a.apply(void 0, [_b.sent()]).toEqual(initialReportCount - expiredOracles.length);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        it('should not remove any reports when reports exist but are not expired', function () { return __awaiter(void 0, void 0, void 0, function () {
            var initialReportCount, tx, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, reportAsOracles(stableTokenOracles)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, sortedOracles.numRates(base_1.CeloContract.StableToken)];
                    case 2:
                        initialReportCount = _b.sent();
                        return [4 /*yield*/, sortedOracles.removeExpiredReports(base_1.CeloContract.StableToken, 1)];
                    case 3:
                        tx = _b.sent();
                        return [4 /*yield*/, tx.sendAndWaitForReceipt({ from: oracleAddress })];
                    case 4:
                        _b.sent();
                        _a = expect;
                        return [4 /*yield*/, sortedOracles.numRates(base_1.CeloContract.StableToken)];
                    case 5:
                        _a.apply(void 0, [_b.sent()]).toEqual(initialReportCount);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#isOldestReportExpired', function () {
        describe('when at least one expired report exists', function () {
            it('returns with true and the address of the last reporting oracle', function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, isExpired, address;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, setupExpiredAndNotExpiredReports([oracleAddress])];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, sortedOracles.isOldestReportExpired(base_1.CeloContract.StableToken)];
                        case 2:
                            _a = _b.sent(), isExpired = _a[0], address = _a[1];
                            expect(isExpired).toEqual(true);
                            expect(address).toEqual(oracleAddress);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('when the oldest is not expired', function () {
            it('returns with false and the address of the last reporting oracle', function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, isExpired, address;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, reportAsOracles(stableTokenOracles)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, sortedOracles.isOldestReportExpired(base_1.CeloContract.StableToken)];
                        case 2:
                            _a = _b.sent(), isExpired = _a[0], address = _a[1];
                            expect(isExpired).toEqual(false);
                            expect(address).toEqual(stableTokenOracles[0]);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    /**
     * Proxy Calls to view methods
     *
     * The purpose of these tests is to verify that these wrapper functions exist,
     * are calling the contract methods correctly, and get some value back. The
     * values checked here are often dependent on setup occuring in the protocol
     * migrations run in `yarn test:prepare`. If these tests are failing, the first
     * thing to check is if there have been changes to the migrations
     */
    describe('#getRates', function () {
        var expectedRates = [2, 1.5, 1, 0.5];
        beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, reportAsOracles(stableTokenOracles, expectedRates)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('SBAT getRates', function () { return __awaiter(void 0, void 0, void 0, function () {
            var actualRates, _i, actualRates_1, rate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sortedOracles.getRates(base_1.CeloContract.StableToken)];
                    case 1:
                        actualRates = _a.sent();
                        expect(actualRates.length).toBeGreaterThan(0);
                        for (_i = 0, actualRates_1 = actualRates; _i < actualRates_1.length; _i++) {
                            rate = actualRates_1[_i];
                            expect(rate).toHaveProperty('address');
                            expect(rate).toHaveProperty('rate');
                            expect(rate).toHaveProperty('medianRelation');
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns the correct rate', function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, actualRates;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sortedOracles.getRates(base_1.CeloContract.StableToken)];
                    case 1:
                        response = _a.sent();
                        actualRates = response.map(function (r) { return r.rate.toNumber(); });
                        expect(actualRates).toEqual(expectedRates);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#isOracle', function () {
        it('returns true when this address is a whitelisted oracle for this token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = expect;
                        return [4 /*yield*/, sortedOracles.isOracle(base_1.CeloContract.StableToken, oracleAddress)];
                    case 1:
                        _a.apply(void 0, [_b.sent()]).toEqual(true);
                        return [2 /*return*/];
                }
            });
        }); });
        it('returns false when this address is not an oracle', function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = expect;
                        return [4 /*yield*/, sortedOracles.isOracle(base_1.CeloContract.StableToken, nonOracleAddress)];
                    case 1:
                        _a.apply(void 0, [_b.sent()]).toEqual(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#numRates', function () {
        it('returns a count of rates reported for the specified token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Why 1? In packages/protocol/08_stabletoken, a single rate is reported
                        _a = expect;
                        return [4 /*yield*/, sortedOracles.numRates(base_1.CeloContract.StableToken)];
                    case 1:
                        // Why 1? In packages/protocol/08_stabletoken, a single rate is reported
                        _a.apply(void 0, [_b.sent()]).toEqBigNumber(1);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#medianRate', function () {
        it('returns the key for the median', function () { return __awaiter(void 0, void 0, void 0, function () {
            var returnedMedian;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sortedOracles.medianRate(base_1.CeloContract.StableToken)];
                    case 1:
                        returnedMedian = _a.sent();
                        expect(returnedMedian.rate).toEqBigNumber(ganache_test_1.NetworkConfig.stableToken.goldPrice);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#reportExpirySeconds', function () {
        it('returns the number of seconds after which a report expires', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sortedOracles.reportExpirySeconds()];
                    case 1:
                        result = _a.sent();
                        expect(result).toEqBigNumber(ganache_test_1.NetworkConfig.oracles.reportExpiry);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    /**
     * Helper Functions
     *
     * These are functions in the wrapper that call other functions, passing in
     * some regularly used arguments. The purpose of these tests is to verify that
     * those arguments are being set correctly.
     */
    describe('getStableTokenRates', function () {
        it('gets rates for Stable Token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var usdRatesResult, getRatesResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sortedOracles.getStableTokenRates()];
                    case 1:
                        usdRatesResult = _a.sent();
                        return [4 /*yield*/, sortedOracles.getRates(base_1.CeloContract.StableToken)];
                    case 2:
                        getRatesResult = _a.sent();
                        expect(usdRatesResult).toEqual(getRatesResult);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('reportStableToken', function () {
        it('calls report with the address for StableToken', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sortedOracles.reportStableToken(14, oracleAddress)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.sendAndWaitForReceipt()];
                    case 2:
                        _a.sent();
                        expect(tx.txo.arguments[0]).toEqual(stableTokenAddress);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=SortedOracles.test.js.map