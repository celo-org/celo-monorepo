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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var registry_utils_1 = require("@celo/protocol/lib/registry-utils");
var test_utils_1 = require("@celo/protocol/lib/test-utils");
var fixidity_1 = require("@celo/utils/lib/fixidity");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var constants_1 = require("../constants");
var Exchange = artifacts.require('Exchange');
var Freezer = artifacts.require('Freezer');
var GoldToken = artifacts.require('GoldToken');
var MockSortedOracles = artifacts.require('MockSortedOracles');
var MockReserve = artifacts.require('MockReserve');
var Registry = artifacts.require('Registry');
var StableToken = artifacts.require('StableToken');
// @ts-ignore
// TODO(mcortesi): Use BN.js
StableToken.numberFormat = 'BigNumber';
// @ts-ignore
Exchange.numberFormat = 'BigNumber';
// @ts-ignore
MockReserve.numberFormat = 'BigNumber';
// @ts-ignore
GoldToken.numberFormat = 'BigNumber';
contract('Exchange', function (accounts) {
    var e_1, _a;
    var exchange;
    var freezer;
    var registry;
    var stableToken;
    var goldToken;
    var mockSortedOracles;
    var mockReserve;
    var decimals = 18;
    var owner = accounts[0];
    var spread = fixidity_1.toFixed(3 / 1000);
    var updateFrequency = 60 * 60;
    var minimumReports = 2;
    var unit = new bignumber_js_1.default(10).pow(decimals);
    var initialReserveBalance = new bignumber_js_1.default(10000000000000000000000);
    var reserveFraction = fixidity_1.toFixed(5 / 100);
    var initialGoldBucket = initialReserveBalance
        .times(fixidity_1.fromFixed(reserveFraction))
        .integerValue(bignumber_js_1.default.ROUND_FLOOR);
    var goldAmountForRate = new bignumber_js_1.default('0x10000000000000000');
    var stableAmountForRate = new bignumber_js_1.default(2).times(goldAmountForRate);
    var initialStableBucket = initialGoldBucket.times(stableAmountForRate).div(goldAmountForRate);
    function getBuyTokenAmount(sellAmount, sellSupply, buySupply, _spread) {
        if (_spread === void 0) { _spread = spread; }
        var reducedSellAmount = fixidity_1.multiply(fixidity_1.fixed1.minus(_spread), fixidity_1.toFixed(sellAmount));
        var numerator = fixidity_1.multiply(reducedSellAmount, fixidity_1.toFixed(buySupply));
        var denominator = fixidity_1.toFixed(sellSupply).plus(reducedSellAmount);
        return numerator.idiv(denominator);
    }
    function getSellTokenAmount(buyAmount, sellSupply, buySupply, _spread) {
        if (_spread === void 0) { _spread = spread; }
        var numerator = fixidity_1.toFixed(fixidity_1.multiply(fixidity_1.toFixed(buyAmount), sellSupply));
        var denominator = fixidity_1.multiply(fixidity_1.toFixed(buySupply.minus(buyAmount)), fixidity_1.fixed1.minus(_spread));
        return numerator.idiv(denominator);
    }
    function fundReserve() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Would have used goldToken here, but ran into issues of inability to transfer
                    // TODO: Remove in https://github.com/celo-org/celo-monorepo/issues/2000
                    return [4 /*yield*/, web3.eth.sendTransaction({
                            from: accounts[0],
                            to: mockReserve.address,
                            value: initialReserveBalance.toString(),
                        })];
                    case 1:
                        // Would have used goldToken here, but ran into issues of inability to transfer
                        // TODO: Remove in https://github.com/celo-org/celo-monorepo/issues/2000
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Freezer.new()];
                case 1:
                    freezer = _a.sent();
                    return [4 /*yield*/, GoldToken.new(true)];
                case 2:
                    goldToken = _a.sent();
                    return [4 /*yield*/, MockReserve.new()];
                case 3:
                    mockReserve = _a.sent();
                    return [4 /*yield*/, StableToken.new()];
                case 4:
                    stableToken = _a.sent();
                    return [4 /*yield*/, Registry.new()];
                case 5:
                    registry = _a.sent();
                    return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.Freezer, freezer.address)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.GoldToken, goldToken.address)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.Reserve, mockReserve.address)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, mockReserve.setGoldToken(goldToken.address)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, goldToken.initialize(registry.address)
                        // TODO: use MockStableToken for this
                    ];
                case 10:
                    _a.sent();
                    // TODO: use MockStableToken for this
                    return [4 /*yield*/, stableToken.initialize('Celo Dollar', 'cUSD', decimals, registry.address, fixidity_1.fixed1, constants_1.SECONDS_IN_A_WEEK, [], [], 'Exchange' // USD
                        )];
                case 11:
                    // TODO: use MockStableToken for this
                    _a.sent();
                    return [4 /*yield*/, MockSortedOracles.new()];
                case 12:
                    mockSortedOracles = _a.sent();
                    return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.SortedOracles, mockSortedOracles.address)];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, mockSortedOracles.setMedianRate(stableToken.address, stableAmountForRate)];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, mockSortedOracles.setNumRates(stableToken.address, 2)];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, fundReserve()];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, Exchange.new()];
                case 18:
                    exchange = _a.sent();
                    return [4 /*yield*/, exchange.initialize(registry.address, stableToken.address, spread, reserveFraction, updateFrequency, minimumReports)];
                case 19:
                    _a.sent();
                    return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.Exchange, exchange.address)];
                case 20:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe('#initialize()', function () {
        it('should have set the owner', function () { return __awaiter(void 0, void 0, void 0, function () {
            var expectedOwner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.owner()];
                    case 1:
                        expectedOwner = _a.sent();
                        assert.equal(expectedOwner, accounts[0]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not be callable again', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.initialize(registry.address, stableToken.address, spread, reserveFraction, updateFrequency, minimumReports))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#setUpdateFrequency', function () {
        var newUpdateFrequency = new bignumber_js_1.default(60 * 30);
        it('should set the update frequency', function () { return __awaiter(void 0, void 0, void 0, function () {
            var actualUpdateFrequency;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setUpdateFrequency(newUpdateFrequency)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, exchange.updateFrequency()];
                    case 2:
                        actualUpdateFrequency = _a.sent();
                        assert.isTrue(actualUpdateFrequency.eq(newUpdateFrequency));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should emit a UpdateFrequencySet event', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setUpdateFrequency(newUpdateFrequency)];
                    case 1:
                        tx = _a.sent();
                        assert(tx.logs.length === 1, 'Did not receive event');
                        log = tx.logs[0];
                        test_utils_1.assertLogMatches2(log, {
                            event: 'UpdateFrequencySet',
                            args: {
                                updateFrequency: newUpdateFrequency,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not allow a non-owner not set the update frequency', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.setUpdateFrequency(newUpdateFrequency, { from: accounts[1] }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#setMinimumReports', function () {
        var newMinimumReports = new bignumber_js_1.default(3);
        it('should set the minimum reports', function () { return __awaiter(void 0, void 0, void 0, function () {
            var actualMinimumReports;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setMinimumReports(newMinimumReports)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, exchange.minimumReports()];
                    case 2:
                        actualMinimumReports = _a.sent();
                        assert.isTrue(actualMinimumReports.eq(newMinimumReports));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should emit a MinimumReportsSet event', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setMinimumReports(newMinimumReports)];
                    case 1:
                        tx = _a.sent();
                        assert(tx.logs.length === 1, 'Did not receive event');
                        log = tx.logs[0];
                        test_utils_1.assertLogMatches2(log, {
                            event: 'MinimumReportsSet',
                            args: {
                                minimumReports: newMinimumReports,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not allow a non-owner not set the minimum reports', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.setMinimumReports(newMinimumReports, { from: accounts[1] }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#setStableToken', function () {
        var newStable = '0x0000000000000000000000000000000000077cfa';
        it('should set the stable token address', function () { return __awaiter(void 0, void 0, void 0, function () {
            var actualStable;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setStableToken(newStable)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, exchange.stable()];
                    case 2:
                        actualStable = _a.sent();
                        assert.equal(actualStable, newStable);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should emit a StableTokenSet event', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setStableToken(newStable)];
                    case 1:
                        tx = _a.sent();
                        assert(tx.logs.length === 1, 'Did not receive event');
                        log = tx.logs[0];
                        test_utils_1.assertLogMatches2(log, {
                            event: 'StableTokenSet',
                            args: {
                                stable: newStable,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not allow a non-owner not set the spread', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.setStableToken(newStable, { from: accounts[1] }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#setSpread', function () {
        var newSpread = fixidity_1.toFixed(6 / 1000);
        it('should set the spread', function () { return __awaiter(void 0, void 0, void 0, function () {
            var actualSpread;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setSpread(newSpread)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, exchange.spread()];
                    case 2:
                        actualSpread = _a.sent();
                        assert.isTrue(actualSpread.eq(newSpread));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should emit a SpreadSet event', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setSpread(newSpread)];
                    case 1:
                        tx = _a.sent();
                        assert(tx.logs.length === 1, 'Did not receive event');
                        log = tx.logs[0];
                        test_utils_1.assertLogMatches2(log, {
                            event: 'SpreadSet',
                            args: {
                                spread: newSpread,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not allow a non-owner not set the spread', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.setSpread(newSpread, { from: accounts[1] }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#setReserveFraction', function () {
        var newReserveFraction = fixidity_1.toFixed(3 / 100);
        it('should set the reserve fraction', function () { return __awaiter(void 0, void 0, void 0, function () {
            var actualReserveFraction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setReserveFraction(newReserveFraction)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, exchange.reserveFraction()];
                    case 2:
                        actualReserveFraction = _a.sent();
                        assert.isTrue(actualReserveFraction.eq(newReserveFraction));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should emit a ReserveFractionSet event', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, exchange.setReserveFraction(newReserveFraction)];
                    case 1:
                        tx = _a.sent();
                        assert(tx.logs.length === 1, 'Did not receive event');
                        log = tx.logs[0];
                        test_utils_1.assertLogMatches2(log, {
                            event: 'ReserveFractionSet',
                            args: {
                                reserveFraction: newReserveFraction,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not allow to set the reserve fraction greater or equal to one', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.setReserveFraction(fixidity_1.toFixed(1)))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not allow a non-owner not set the reserve fraction', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.setReserveFraction(newReserveFraction, { from: accounts[1] }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#getBuyAndSellBuckets', function () {
        it('should return the correct amount of buy and sell token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, buyBucketSize, sellBucketSize;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, exchange.getBuyAndSellBuckets(true)];
                    case 1:
                        _a = __read.apply(void 0, [_b.sent(), 2]), buyBucketSize = _a[0], sellBucketSize = _a[1];
                        test_utils_1.assertEqualBN(sellBucketSize, initialGoldBucket);
                        test_utils_1.assertEqualBN(buyBucketSize, initialStableBucket);
                        return [2 /*return*/];
                }
            });
        }); });
        describe("after the Reserve's balance changes", function () {
            beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fundReserve()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should return the same value if updateFrequency seconds haven't passed yet", function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, buyBucketSize, sellBucketSize;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, exchange.getBuyAndSellBuckets(true)];
                        case 2:
                            _a = __read.apply(void 0, [_b.sent(), 2]), buyBucketSize = _a[0], sellBucketSize = _a[1];
                            test_utils_1.assertEqualBN(sellBucketSize, initialGoldBucket);
                            test_utils_1.assertEqualBN(buyBucketSize, initialStableBucket);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should return a new value once updateFrequency seconds have passed", function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, buyBucketSize, sellBucketSize;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, test_utils_1.timeTravel(updateFrequency, web3)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, exchange.getBuyAndSellBuckets(true)];
                        case 3:
                            _a = __read.apply(void 0, [_b.sent(), 2]), buyBucketSize = _a[0], sellBucketSize = _a[1];
                            test_utils_1.assertEqualBN(sellBucketSize, initialGoldBucket.times(2));
                            test_utils_1.assertEqualBN(buyBucketSize, initialStableBucket.times(2));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('after an oracle update', function () {
            beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, mockSortedOracles.setMedianRate(stableToken.address, goldAmountForRate.times(4))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should return the same value if updateFrequency seconds haven't passed yet", function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, buyBucketSize, sellBucketSize;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, exchange.getBuyAndSellBuckets(true)];
                        case 2:
                            _a = __read.apply(void 0, [_b.sent(), 2]), buyBucketSize = _a[0], sellBucketSize = _a[1];
                            test_utils_1.assertEqualBN(sellBucketSize, initialGoldBucket);
                            test_utils_1.assertEqualBN(buyBucketSize, initialStableBucket);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should return a new value once updateFrequency seconds have passed", function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, buyBucketSize, sellBucketSize;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, test_utils_1.timeTravel(updateFrequency, web3)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, exchange.getBuyAndSellBuckets(true)];
                        case 3:
                            _a = __read.apply(void 0, [_b.sent(), 2]), buyBucketSize = _a[0], sellBucketSize = _a[1];
                            test_utils_1.assertEqualBN(sellBucketSize, initialGoldBucket);
                            test_utils_1.assertEqualBN(buyBucketSize, initialStableBucket.times(2));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    describe('#getBuyTokenAmount', function () {
        it('should return the correct amount of buyToken', function () { return __awaiter(void 0, void 0, void 0, function () {
            var amount, buyAmount, expectedBuyAmount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        amount = 10;
                        return [4 /*yield*/, exchange.getBuyTokenAmount(amount, true)];
                    case 1:
                        buyAmount = _a.sent();
                        expectedBuyAmount = getBuyTokenAmount(new bignumber_js_1.default(amount), initialGoldBucket, initialStableBucket);
                        assert.equal(buyAmount.toString(), expectedBuyAmount.toString());
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('#getSellTokenAmount', function () {
        it('should return the correct amount of sellToken', function () { return __awaiter(void 0, void 0, void 0, function () {
            var buyAmount, sellAmount, expectedSellAmount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        buyAmount = 10;
                        return [4 /*yield*/, exchange.getSellTokenAmount(buyAmount, true)];
                    case 1:
                        sellAmount = _a.sent();
                        expectedSellAmount = getSellTokenAmount(new bignumber_js_1.default(buyAmount), initialGoldBucket, initialStableBucket);
                        assert.equal(sellAmount.toString(), expectedSellAmount.toString());
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // Run the following test for both these functions. Exchange is deprecated
    // and has the same functionality as sell.
    var sellFunctionNames = ['sell', 'exchange'];
    var _loop_1 = function (sellFunctionName) {
        describe("#" + sellFunctionName, function () {
            var user = accounts[1];
            // This test is run for both the `sell` and `exchange` functions
            var sellFunction;
            beforeEach(function () {
                sellFunction = exchange[sellFunctionName];
            });
            describe('when selling gold for stable', function () {
                var goldTokenAmount = unit.div(500).integerValue(bignumber_js_1.default.ROUND_FLOOR);
                var expectedStableBalance = getBuyTokenAmount(goldTokenAmount, initialGoldBucket, initialStableBucket);
                var oldGoldBalance;
                var oldReserveGoldBalance;
                var oldTotalSupply;
                beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, stableToken.totalSupply()];
                            case 1:
                                oldTotalSupply = _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(mockReserve.address)];
                            case 2:
                                oldReserveGoldBalance = _a.sent();
                                return [4 /*yield*/, goldToken.approve(exchange.address, goldTokenAmount, { from: user })];
                            case 3:
                                _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(user)];
                            case 4:
                                oldGoldBalance = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should increase the user's stable balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var newStableBalance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, stableToken.balanceOf(user)];
                            case 2:
                                newStableBalance = _a.sent();
                                test_utils_1.assertEqualBN(newStableBalance, expectedStableBalance);
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should decrease the user's gold balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var actualGoldBalance, expectedGoldBalance, blockReward;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(user)];
                            case 2:
                                actualGoldBalance = _a.sent();
                                expectedGoldBalance = oldGoldBalance.minus(goldTokenAmount);
                                return [4 /*yield*/, test_utils_1.addressMinedLatestBlock(user)];
                            case 3:
                                if (_a.sent()) {
                                    blockReward = new bignumber_js_1.default(2).times(new bignumber_js_1.default(10).pow(decimals));
                                    expectedGoldBalance = expectedGoldBalance.plus(blockReward);
                                }
                                test_utils_1.assertEqualBN(actualGoldBalance, expectedGoldBalance);
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should remove the user's allowance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var allowance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, goldToken.allowance(user, exchange.address)];
                            case 2:
                                allowance = _a.sent();
                                assert.isTrue(allowance.isZero());
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should increase the Reserve's balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var newReserveGoldBalance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(mockReserve.address)];
                            case 2:
                                newReserveGoldBalance = _a.sent();
                                assert.isTrue(newReserveGoldBalance.eq(oldReserveGoldBalance.plus(goldTokenAmount)));
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should increase the total StableToken supply', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var newTotalSupply;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, stableToken.totalSupply()];
                            case 2:
                                newTotalSupply = _a.sent();
                                assert.isTrue(newTotalSupply.eq(oldTotalSupply.plus(expectedStableBalance)));
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should affect token buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, mintableStable, tradeableGold, expectedTradeableGold, expectedMintableStable;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, exchange.getBuyAndSellBuckets(true)];
                            case 2:
                                _a = __read.apply(void 0, [_b.sent(), 2]), mintableStable = _a[0], tradeableGold = _a[1];
                                expectedTradeableGold = initialGoldBucket.plus(goldTokenAmount);
                                expectedMintableStable = initialStableBucket.minus(expectedStableBalance);
                                test_utils_1.assertEqualBN(tradeableGold, expectedTradeableGold);
                                test_utils_1.assertEqualBN(mintableStable, expectedMintableStable);
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should emit an Exchanged event', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var exchangeTx, exchangeLogs, log;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                exchangeTx = _a.sent();
                                exchangeLogs = exchangeTx.logs.filter(function (x) { return x.event === 'Exchanged'; });
                                assert(exchangeLogs.length === 1, 'Did not receive event');
                                log = exchangeLogs[0];
                                test_utils_1.assertLogMatches2(log, {
                                    event: 'Exchanged',
                                    args: {
                                        exchanger: user,
                                        sellAmount: goldTokenAmount,
                                        buyAmount: expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR),
                                        soldGold: true,
                                    },
                                });
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should revert without sufficient approvals', function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, test_utils_1.assertRevert(sellFunction(goldTokenAmount.plus(1), expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                }))];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should revert if the minBuyAmount could not be satisfied', function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, test_utils_1.assertRevert(sellFunction(goldTokenAmount, expectedStableBalance.integerValue(bignumber_js_1.default.ROUND_FLOOR).plus(1), true, {
                                    from: user,
                                }))];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                describe('when buckets need updating', function () {
                    // fundReserve() will double the amount in the gold bucket
                    var updatedGoldBucket = initialGoldBucket.times(2);
                    var updatedStableBucket = updatedGoldBucket
                        .times(stableAmountForRate)
                        .div(goldAmountForRate);
                    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fundReserve()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, test_utils_1.timeTravel(updateFrequency, web3)];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    describe('when the oldest oracle report is not expired', function () {
                        var expectedStableAmount = getBuyTokenAmount(goldTokenAmount, updatedGoldBucket, updatedStableBucket);
                        it('the exchange should succeed', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var newStableBalance;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                            from: user,
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, stableToken.balanceOf(user)];
                                    case 2:
                                        newStableBalance = _a.sent();
                                        test_utils_1.assertEqualBN(newStableBalance, expectedStableAmount);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it('should update the buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var newGoldBucket, newStableBucket;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                            from: user,
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, exchange.goldBucket()];
                                    case 2:
                                        newGoldBucket = _a.sent();
                                        return [4 /*yield*/, exchange.stableBucket()
                                            // The new value should be the updatedGoldBucket value, which is 2x the
                                            // initial amount after fundReserve() is called, plus the amount of gold
                                            // that was paid in the exchange.
                                        ];
                                    case 3:
                                        newStableBucket = _a.sent();
                                        // The new value should be the updatedGoldBucket value, which is 2x the
                                        // initial amount after fundReserve() is called, plus the amount of gold
                                        // that was paid in the exchange.
                                        test_utils_1.assertEqualBN(newGoldBucket, updatedGoldBucket.plus(goldTokenAmount));
                                        // The new value should be the updatedStableBucket (derived from the new
                                        // Gold Bucket value), minus the amount purchased during the exchange
                                        test_utils_1.assertEqualBN(newStableBucket, updatedStableBucket.minus(expectedStableAmount));
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    describe('when the oldest oracle report is expired', function () {
                        var expectedStableAmount = getBuyTokenAmount(goldTokenAmount, initialGoldBucket, initialStableBucket);
                        beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, mockSortedOracles.setOldestReportExpired(stableToken.address)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it('the exchange should succeed', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var newStableBalance;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                            from: user,
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, stableToken.balanceOf(user)];
                                    case 2:
                                        newStableBalance = _a.sent();
                                        test_utils_1.assertEqualBN(newStableBalance, expectedStableAmount);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it('should not update the buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var newGoldBucket, newStableBucket;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, sellFunction(goldTokenAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                            from: user,
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, exchange.goldBucket()];
                                    case 2:
                                        newGoldBucket = _a.sent();
                                        return [4 /*yield*/, exchange.stableBucket()
                                            // The new value should be the initialGoldBucket value plus the goldTokenAmount.
                                        ];
                                    case 3:
                                        newStableBucket = _a.sent();
                                        // The new value should be the initialGoldBucket value plus the goldTokenAmount.
                                        test_utils_1.assertEqualBN(newGoldBucket, initialGoldBucket.plus(goldTokenAmount));
                                        // The new value should be the initialStableBucket minus the amount purchased during the exchange
                                        test_utils_1.assertEqualBN(newStableBucket, initialStableBucket.minus(expectedStableAmount));
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                });
            });
            describe('when selling stable for gold', function () {
                var stableTokenBalance = unit.div(1000).integerValue(bignumber_js_1.default.ROUND_FLOOR);
                var expectedGoldBalanceIncrease = getBuyTokenAmount(stableTokenBalance, initialStableBucket, initialGoldBucket);
                var oldGoldBalance;
                var oldReserveGoldBalance;
                beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.Exchange, owner)];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, stableToken.mint(user, stableTokenBalance)];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.Exchange, exchange.address)];
                            case 3:
                                _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(mockReserve.address)];
                            case 4:
                                oldReserveGoldBalance = _a.sent();
                                return [4 /*yield*/, stableToken.approve(exchange.address, stableTokenBalance, { from: user })];
                            case 5:
                                _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(user)];
                            case 6:
                                oldGoldBalance = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should decrease the user's stable balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var newStableBalance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, stableToken.balanceOf(user)];
                            case 2:
                                newStableBalance = _a.sent();
                                assert.isTrue(newStableBalance.isZero());
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should increase the user's gold balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var actualGoldBalance, expectedGoldBalance, blockReward;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(user)];
                            case 2:
                                actualGoldBalance = _a.sent();
                                expectedGoldBalance = oldGoldBalance.plus(expectedGoldBalanceIncrease);
                                return [4 /*yield*/, test_utils_1.addressMinedLatestBlock(user)];
                            case 3:
                                if (_a.sent()) {
                                    blockReward = new bignumber_js_1.default(2).times(new bignumber_js_1.default(10).pow(decimals));
                                    expectedGoldBalance = expectedGoldBalance.plus(blockReward);
                                }
                                assert.isTrue(actualGoldBalance.eq(expectedGoldBalance));
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should remove the user's allowance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var allowance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, goldToken.allowance(user, exchange.address)];
                            case 2:
                                allowance = _a.sent();
                                assert.isTrue(allowance.isZero());
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should decrease the Reserve's balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var newReserveGoldBalance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(mockReserve.address)];
                            case 2:
                                newReserveGoldBalance = _a.sent();
                                assert.isTrue(newReserveGoldBalance.eq(oldReserveGoldBalance.minus(expectedGoldBalanceIncrease)));
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should decrease the total StableToken supply', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var newTotalSupply;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, stableToken.totalSupply()];
                            case 2:
                                newTotalSupply = _a.sent();
                                assert.isTrue(newTotalSupply.isZero());
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should affect token buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a, tradeableGold, mintableStable, expectedMintableStable, expectedTradeableGold;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                    from: user,
                                })];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, exchange.getBuyAndSellBuckets(false)];
                            case 2:
                                _a = __read.apply(void 0, [_b.sent(), 2]), tradeableGold = _a[0], mintableStable = _a[1];
                                expectedMintableStable = initialStableBucket.plus(stableTokenBalance);
                                expectedTradeableGold = initialGoldBucket.minus(expectedGoldBalanceIncrease);
                                assert.isTrue(mintableStable.eq(expectedMintableStable));
                                assert.isTrue(tradeableGold.eq(expectedTradeableGold));
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should emit an Exchanged event', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var exchangeTx, exchangeLogs, log;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                    from: user,
                                })];
                            case 1:
                                exchangeTx = _a.sent();
                                exchangeLogs = exchangeTx.logs.filter(function (x) { return x.event === 'Exchanged'; });
                                assert(exchangeLogs.length === 1, 'Did not receive event');
                                log = exchangeLogs[0];
                                test_utils_1.assertLogMatches2(log, {
                                    event: 'Exchanged',
                                    args: {
                                        exchanger: user,
                                        sellAmount: stableTokenBalance,
                                        buyAmount: expectedGoldBalanceIncrease,
                                        soldGold: false,
                                    },
                                });
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should revert without sufficient approvals', function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, test_utils_1.assertRevert(sellFunction(stableTokenBalance.plus(1), expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                    from: user,
                                }))];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should revert if the minBuyAmount could not be satisfied', function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, test_utils_1.assertRevert(sellFunction(stableTokenBalance, expectedGoldBalanceIncrease.integerValue(bignumber_js_1.default.ROUND_FLOOR).plus(1), false, {
                                    from: user,
                                }))];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                describe('when buckets need updating', function () {
                    // fundReserve() will double the amount in the gold bucket
                    var updatedGoldBucket = initialGoldBucket.times(2);
                    var updatedStableBucket = updatedGoldBucket
                        .times(stableAmountForRate)
                        .div(goldAmountForRate);
                    var expectedGoldAmount = getBuyTokenAmount(stableTokenBalance, updatedStableBucket, updatedGoldBucket);
                    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fundReserve()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, test_utils_1.timeTravel(updateFrequency, web3)];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    it('the exchange should succeed', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var newGoldBalance;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                        from: user,
                                    })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, goldToken.balanceOf(user)];
                                case 2:
                                    newGoldBalance = _a.sent();
                                    test_utils_1.assertEqualBN(newGoldBalance, oldGoldBalance.plus(expectedGoldAmount));
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    it('should update the buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var newGoldBucket, newStableBucket;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                        from: user,
                                    })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, exchange.goldBucket()];
                                case 2:
                                    newGoldBucket = _a.sent();
                                    return [4 /*yield*/, exchange.stableBucket()
                                        // The new value should be the updatedGoldBucket value, which is 2x the
                                        // initial amount after fundReserve() is called, plus the amount of gold
                                        // that was paid in the exchange.
                                    ];
                                case 3:
                                    newStableBucket = _a.sent();
                                    // The new value should be the updatedGoldBucket value, which is 2x the
                                    // initial amount after fundReserve() is called, plus the amount of gold
                                    // that was paid in the exchange.
                                    test_utils_1.assertEqualBN(newGoldBucket, updatedGoldBucket.minus(expectedGoldAmount));
                                    // The new value should be the updatedStableBucket (derived from the new
                                    // Gold Bucket value), minus the amount purchased during the exchange
                                    test_utils_1.assertEqualBN(newStableBucket, updatedStableBucket.plus(stableTokenBalance));
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    it('should emit an BucketsUpdated event', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var exchangeTx, exchangeLogs, log;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, sellFunction(stableTokenBalance, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                        from: user,
                                    })];
                                case 1:
                                    exchangeTx = _a.sent();
                                    exchangeLogs = exchangeTx.logs.filter(function (x) { return x.event === 'BucketsUpdated'; });
                                    assert(exchangeLogs.length === 1, 'Did not receive event');
                                    log = exchangeLogs[0];
                                    test_utils_1.assertLogMatches2(log, {
                                        event: 'BucketsUpdated',
                                        args: {
                                            goldBucket: updatedGoldBucket,
                                            stableBucket: updatedStableBucket,
                                        },
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                });
            });
            describe('when the contract is frozen', function () {
                beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, freezer.freeze(exchange.address)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should revert', function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, goldToken.approve(exchange.address, 1000)];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, test_utils_1.assertRevert(sellFunction(1000, 1, true))];
                            case 2:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
            });
        });
    };
    try {
        for (var sellFunctionNames_1 = __values(sellFunctionNames), sellFunctionNames_1_1 = sellFunctionNames_1.next(); !sellFunctionNames_1_1.done; sellFunctionNames_1_1 = sellFunctionNames_1.next()) {
            var sellFunctionName = sellFunctionNames_1_1.value;
            _loop_1(sellFunctionName);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (sellFunctionNames_1_1 && !sellFunctionNames_1_1.done && (_a = sellFunctionNames_1.return)) _a.call(sellFunctionNames_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    describe('#buy', function () {
        var user = accounts[1];
        describe('when buying stable with gold', function () {
            var buyStableAmount = unit.div(500).integerValue(bignumber_js_1.default.ROUND_FLOOR);
            var expectedGoldAmount = getSellTokenAmount(buyStableAmount, initialGoldBucket, initialStableBucket);
            var oldGoldBalance;
            var oldReserveGoldBalance;
            var oldTotalSupply;
            beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, stableToken.totalSupply()];
                        case 1:
                            oldTotalSupply = _a.sent();
                            return [4 /*yield*/, goldToken.balanceOf(mockReserve.address)];
                        case 2:
                            oldReserveGoldBalance = _a.sent();
                            return [4 /*yield*/, goldToken.approve(exchange.address, expectedGoldAmount, { from: user })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, goldToken.balanceOf(user)];
                        case 4:
                            oldGoldBalance = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should increase the user's stable balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                var newStableBalance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, stableToken.balanceOf(user)];
                        case 2:
                            newStableBalance = _a.sent();
                            test_utils_1.assertEqualBN(newStableBalance, buyStableAmount);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should decrease the user's gold balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                var actualGoldBalance, expectedGoldBalance, blockReward;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, goldToken.balanceOf(user)];
                        case 2:
                            actualGoldBalance = _a.sent();
                            expectedGoldBalance = oldGoldBalance.minus(expectedGoldAmount);
                            return [4 /*yield*/, test_utils_1.addressMinedLatestBlock(user)];
                        case 3:
                            if (_a.sent()) {
                                blockReward = new bignumber_js_1.default(2).times(new bignumber_js_1.default(10).pow(decimals));
                                expectedGoldBalance = expectedGoldBalance.plus(blockReward);
                            }
                            test_utils_1.assertEqualBN(actualGoldBalance, expectedGoldBalance);
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should remove the user's allowance", function () { return __awaiter(void 0, void 0, void 0, function () {
                var allowance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, goldToken.allowance(user, exchange.address)];
                        case 2:
                            allowance = _a.sent();
                            assert.isTrue(allowance.isZero());
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should increase the Reserve's balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                var newReserveGoldBalance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, goldToken.balanceOf(mockReserve.address)];
                        case 2:
                            newReserveGoldBalance = _a.sent();
                            assert.isTrue(newReserveGoldBalance.eq(oldReserveGoldBalance.plus(expectedGoldAmount)));
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should increase the total StableToken supply', function () { return __awaiter(void 0, void 0, void 0, function () {
                var newTotalSupply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, stableToken.totalSupply()];
                        case 2:
                            newTotalSupply = _a.sent();
                            assert.isTrue(newTotalSupply.eq(oldTotalSupply.plus(buyStableAmount)));
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should affect token buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, mintableStable, tradeableGold, expectedTradeableGold, expectedMintableStable;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                from: user,
                            })];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, exchange.getBuyAndSellBuckets(true)];
                        case 2:
                            _a = __read.apply(void 0, [_b.sent(), 2]), mintableStable = _a[0], tradeableGold = _a[1];
                            expectedTradeableGold = initialGoldBucket.plus(expectedGoldAmount);
                            expectedMintableStable = initialStableBucket.minus(buyStableAmount);
                            test_utils_1.assertEqualBN(tradeableGold, expectedTradeableGold);
                            test_utils_1.assertEqualBN(mintableStable, expectedMintableStable);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should emit an Exchanged event', function () { return __awaiter(void 0, void 0, void 0, function () {
                var exchangeTx, exchangeLogs, log;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                from: user,
                            })];
                        case 1:
                            exchangeTx = _a.sent();
                            exchangeLogs = exchangeTx.logs.filter(function (x) { return x.event === 'Exchanged'; });
                            assert(exchangeLogs.length === 1, 'Did not receive event');
                            log = exchangeLogs[0];
                            test_utils_1.assertLogMatches2(log, {
                                event: 'Exchanged',
                                args: {
                                    exchanger: user,
                                    sellAmount: expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR),
                                    buyAmount: buyStableAmount,
                                    soldGold: true,
                                },
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should revert without sufficient approvals', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.buy(buyStableAmount.plus(1), expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                from: user,
                            }))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should revert if the maxSellAmount could not be satisfied', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.buy(buyStableAmount, expectedGoldAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR).minus(1), false, {
                                from: user,
                            }))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            describe('when buckets need updating', function () {
                // fundReserve() will double the amount in the gold bucket
                var updatedGoldBucket = initialGoldBucket.times(2);
                var updatedStableBucket = updatedGoldBucket
                    .times(stableAmountForRate)
                    .div(goldAmountForRate);
                beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fundReserve()];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, test_utils_1.timeTravel(updateFrequency, web3)];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                            case 3:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                describe('when the oldest oracle report is not expired', function () {
                    var expectedGoldAmountNoReportExpired = getSellTokenAmount(buyStableAmount, updatedGoldBucket, updatedStableBucket);
                    it('the exchange should succeed', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var newStableBalance;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmountNoReportExpired.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                        from: user,
                                    })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, stableToken.balanceOf(user)];
                                case 2:
                                    newStableBalance = _a.sent();
                                    test_utils_1.assertEqualBN(newStableBalance, buyStableAmount);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    it('should update the buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var newGoldBucket, newStableBucket;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmountNoReportExpired.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                        from: user,
                                    })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, exchange.goldBucket()];
                                case 2:
                                    newGoldBucket = _a.sent();
                                    return [4 /*yield*/, exchange.stableBucket()
                                        // The new value should be the updatedGoldBucket value, which is 2x the
                                        // initial amount after fundReserve() is called, plus the amount of gold
                                        // that was paid in the exchange.
                                    ];
                                case 3:
                                    newStableBucket = _a.sent();
                                    // The new value should be the updatedGoldBucket value, which is 2x the
                                    // initial amount after fundReserve() is called, plus the amount of gold
                                    // that was paid in the exchange.
                                    test_utils_1.assertEqualBN(newGoldBucket, updatedGoldBucket.plus(expectedGoldAmountNoReportExpired));
                                    // The new value should be the updatedStableBucket (derived from the new
                                    // Gold Bucket value), minus the amount purchased during the exchange
                                    test_utils_1.assertEqualBN(newStableBucket, updatedStableBucket.minus(buyStableAmount));
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                });
                describe('when the oldest oracle report is expired', function () {
                    var expectedGoldAmountReportIsExpired = getSellTokenAmount(buyStableAmount, initialGoldBucket, initialStableBucket);
                    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, mockSortedOracles.setOldestReportExpired(stableToken.address)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    it('the exchange should succeed', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var newStableBalance;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmountReportIsExpired.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                        from: user,
                                    })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, stableToken.balanceOf(user)];
                                case 2:
                                    newStableBalance = _a.sent();
                                    test_utils_1.assertEqualBN(newStableBalance, buyStableAmount);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    it('should not update the buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var newGoldBucket, newStableBucket;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, exchange.buy(buyStableAmount, expectedGoldAmountReportIsExpired.integerValue(bignumber_js_1.default.ROUND_FLOOR), false, {
                                        from: user,
                                    })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, exchange.goldBucket()];
                                case 2:
                                    newGoldBucket = _a.sent();
                                    return [4 /*yield*/, exchange.stableBucket()
                                        // The new value should be the initialGoldBucket value plus the goldTokenAmount.
                                    ];
                                case 3:
                                    newStableBucket = _a.sent();
                                    // The new value should be the initialGoldBucket value plus the goldTokenAmount.
                                    test_utils_1.assertEqualBN(newGoldBucket, initialGoldBucket.plus(expectedGoldAmountReportIsExpired));
                                    // The new value should be the initialStableBucket minus the amount purchased during the exchange
                                    test_utils_1.assertEqualBN(newStableBucket, initialStableBucket.minus(buyStableAmount));
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                });
            });
        });
        describe('when buying gold with stable', function () {
            var buyGoldAmount = unit.div(1000).integerValue(bignumber_js_1.default.ROUND_FLOOR);
            var expectedStableAmount = getSellTokenAmount(buyGoldAmount, initialStableBucket, initialGoldBucket);
            var oldGoldBalance;
            var oldReserveGoldBalance;
            beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.Exchange, owner)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, stableToken.mint(user, expectedStableAmount)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, registry.setAddressFor(registry_utils_1.CeloContractName.Exchange, exchange.address)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, goldToken.balanceOf(mockReserve.address)];
                        case 4:
                            oldReserveGoldBalance = _a.sent();
                            return [4 /*yield*/, stableToken.approve(exchange.address, expectedStableAmount, { from: user })];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, goldToken.balanceOf(user)];
                        case 6:
                            oldGoldBalance = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should decrease the user's stable balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                var newStableBalance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, stableToken.balanceOf(user)];
                        case 2:
                            newStableBalance = _a.sent();
                            assert.isTrue(newStableBalance.isZero());
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should increase the user's gold balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                var actualGoldBalance, expectedGoldBalance, blockReward;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, goldToken.balanceOf(user)];
                        case 2:
                            actualGoldBalance = _a.sent();
                            expectedGoldBalance = oldGoldBalance.plus(buyGoldAmount);
                            return [4 /*yield*/, test_utils_1.addressMinedLatestBlock(user)];
                        case 3:
                            if (_a.sent()) {
                                blockReward = new bignumber_js_1.default(2).times(new bignumber_js_1.default(10).pow(decimals));
                                expectedGoldBalance = expectedGoldBalance.plus(blockReward);
                            }
                            assert.isTrue(actualGoldBalance.eq(expectedGoldBalance));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should remove the user's allowance", function () { return __awaiter(void 0, void 0, void 0, function () {
                var allowance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, goldToken.allowance(user, exchange.address)];
                        case 2:
                            allowance = _a.sent();
                            assert.isTrue(allowance.isZero());
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should decrease the Reserve's balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                var newReserveGoldBalance;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, goldToken.balanceOf(mockReserve.address)];
                        case 2:
                            newReserveGoldBalance = _a.sent();
                            assert.isTrue(newReserveGoldBalance.eq(oldReserveGoldBalance.minus(buyGoldAmount)));
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should decrease the total StableToken supply', function () { return __awaiter(void 0, void 0, void 0, function () {
                var newTotalSupply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                from: user,
                            })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, stableToken.totalSupply()];
                        case 2:
                            newTotalSupply = _a.sent();
                            assert.isTrue(newTotalSupply.isZero());
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should affect token buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                var _a, tradeableGold, mintableStable, expectedMintableStable, expectedTradeableGold;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                from: user,
                            })];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, exchange.getBuyAndSellBuckets(false)];
                        case 2:
                            _a = __read.apply(void 0, [_b.sent(), 2]), tradeableGold = _a[0], mintableStable = _a[1];
                            expectedMintableStable = initialStableBucket.plus(expectedStableAmount);
                            expectedTradeableGold = initialGoldBucket.minus(buyGoldAmount);
                            assert.isTrue(mintableStable.eq(expectedMintableStable));
                            assert.isTrue(tradeableGold.eq(expectedTradeableGold));
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should emit an Exchanged event', function () { return __awaiter(void 0, void 0, void 0, function () {
                var exchangeTx, exchangeLogs, log;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                from: user,
                            })];
                        case 1:
                            exchangeTx = _a.sent();
                            exchangeLogs = exchangeTx.logs.filter(function (x) { return x.event === 'Exchanged'; });
                            assert(exchangeLogs.length === 1, 'Did not receive event');
                            log = exchangeLogs[0];
                            test_utils_1.assertLogMatches2(log, {
                                event: 'Exchanged',
                                args: {
                                    exchanger: user,
                                    sellAmount: expectedStableAmount,
                                    buyAmount: buyGoldAmount,
                                    soldGold: false,
                                },
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should revert without sufficient approvals', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.buy(buyGoldAmount.plus(1), expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                from: user,
                            }))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should revert if the maxSellAmount could not be satisfied', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, test_utils_1.assertRevert(exchange.buy(buyGoldAmount, expectedStableAmount.integerValue(bignumber_js_1.default.ROUND_FLOOR).minus(1), true, {
                                from: user,
                            }))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            describe('when buckets need updating', function () {
                // fundReserve() will double the amount in the gold bucket
                var updatedGoldBucket = initialGoldBucket.times(2);
                var updatedStableBucket = updatedGoldBucket
                    .times(stableAmountForRate)
                    .div(goldAmountForRate);
                var expectedStableAmountBucketUpdating = getSellTokenAmount(buyGoldAmount, updatedStableBucket, updatedGoldBucket);
                beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fundReserve()];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, test_utils_1.timeTravel(updateFrequency, web3)];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, mockSortedOracles.setMedianTimestampToNow(stableToken.address)];
                            case 3:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('the exchange should succeed', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var newGoldBalance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmountBucketUpdating.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, goldToken.balanceOf(user)];
                            case 2:
                                newGoldBalance = _a.sent();
                                test_utils_1.assertEqualBN(newGoldBalance, oldGoldBalance.plus(buyGoldAmount));
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should update the buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var newGoldBucket, newStableBucket;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmountBucketUpdating.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, exchange.goldBucket()];
                            case 2:
                                newGoldBucket = _a.sent();
                                return [4 /*yield*/, exchange.stableBucket()
                                    // The new value should be the updatedGoldBucket value, which is 2x the
                                    // initial amount after fundReserve() is called, plus the amount of gold
                                    // that was paid in the exchange.
                                ];
                            case 3:
                                newStableBucket = _a.sent();
                                // The new value should be the updatedGoldBucket value, which is 2x the
                                // initial amount after fundReserve() is called, plus the amount of gold
                                // that was paid in the exchange.
                                test_utils_1.assertEqualBN(newGoldBucket, updatedGoldBucket.minus(buyGoldAmount));
                                // The new value should be the updatedStableBucket (derived from the new
                                // Gold Bucket value), minus the amount purchased during the exchange
                                test_utils_1.assertEqualBN(newStableBucket, updatedStableBucket.plus(expectedStableAmountBucketUpdating));
                                return [2 /*return*/];
                        }
                    });
                }); });
                it('should emit an BucketsUpdated event', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var exchangeTx, exchangeLogs, log;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, exchange.buy(buyGoldAmount, expectedStableAmountBucketUpdating.integerValue(bignumber_js_1.default.ROUND_FLOOR), true, {
                                    from: user,
                                })];
                            case 1:
                                exchangeTx = _a.sent();
                                exchangeLogs = exchangeTx.logs.filter(function (x) { return x.event === 'BucketsUpdated'; });
                                assert(exchangeLogs.length === 1, 'Did not receive event');
                                log = exchangeLogs[0];
                                test_utils_1.assertLogMatches2(log, {
                                    event: 'BucketsUpdated',
                                    args: {
                                        goldBucket: updatedGoldBucket,
                                        stableBucket: updatedStableBucket,
                                    },
                                });
                                return [2 /*return*/];
                        }
                    });
                }); });
            });
        });
        describe('when the contract is frozen', function () {
            beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, freezer.freeze(exchange.address)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should revert', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, goldToken.approve(exchange.address, 1000)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, test_utils_1.assertRevert(exchange.buy(1000, 1, true))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=exchange.js.map