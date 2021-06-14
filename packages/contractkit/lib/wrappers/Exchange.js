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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Contract that allows to exchange StableToken for GoldToken and vice versa
 * using a Constant Product Market Maker Model
 */
var ExchangeWrapper = /** @class */ (function (_super) {
    __extends(ExchangeWrapper, _super);
    function ExchangeWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Query spread parameter
         * @returns Current spread charged on exchanges
         */
        _this.spread = BaseWrapper_1.proxyCall(_this.contract.methods.spread, undefined, BaseWrapper_1.fixidityValueToBigNumber);
        /**
         * Query reserve fraction parameter
         * @returns Current fraction to commit to the gold bucket
         */
        _this.reserveFraction = BaseWrapper_1.proxyCall(_this.contract.methods.reserveFraction, undefined, BaseWrapper_1.fixidityValueToBigNumber);
        /**
         * Query update frequency parameter
         * @returns The time period that needs to elapse between bucket
         * updates
         */
        _this.updateFrequency = BaseWrapper_1.proxyCall(_this.contract.methods.updateFrequency, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Query minimum reports parameter
         * @returns The minimum number of fresh reports that need to be
         * present in the oracle to update buckets
         * commit to the gold bucket
         */
        _this.minimumReports = BaseWrapper_1.proxyCall(_this.contract.methods.minimumReports, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Query last bucket update
         * @returns The timestamp of the last time exchange buckets were updated.
         */
        _this.lastBucketUpdate = BaseWrapper_1.proxyCall(_this.contract.methods.lastBucketUpdate, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the buy token and sell token bucket sizes, in order. The ratio of
         * the two also represents the exchange rate between the two.
         * @param sellGold `true` if gold is the sell token
         * @return [buyTokenBucket, sellTokenBucket]
         */
        _this.getBuyAndSellBuckets = BaseWrapper_1.proxyCall(_this.contract.methods.getBuyAndSellBuckets, undefined, function (callRes) {
            return [BaseWrapper_1.valueToBigNumber(callRes[0]), BaseWrapper_1.valueToBigNumber(callRes[1])];
        });
        /**
         * Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
         * Requires the sellAmount to have been approved to the exchange
         * @param sellAmount The amount of sellToken the user is selling to the exchange
         * @param minBuyAmount The minimum amount of buyToken the user has to receive for this
         * transaction to succeed
         * @param sellGold `true` if gold is the sell token
         * @return The amount of buyToken that was transfered
         */
        _this.exchange = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.exchange, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString, BaseWrapper_1.valueToString, BaseWrapper_1.identity));
        /**
         * Exchanges amount of cGLD in exchange for at least minUsdAmount of cUsd
         * Requires the amount to have been approved to the exchange
         * @param amount The amount of cGLD the user is selling to the exchange
         * @param minUsdAmount The minimum amount of cUsd the user has to receive for this
         * transaction to succeed
         */
        _this.sellGold = function (amount, minUSDAmount) {
            return _this.exchange(amount, minUSDAmount, true);
        };
        /**
         * Exchanges amount of cUsd in exchange for at least minGoldAmount of cGLD
         * Requires the amount to have been approved to the exchange
         * @param amount The amount of cUsd the user is selling to the exchange
         * @param minGoldAmount The minimum amount of cGLD the user has to receive for this
         * transaction to succeed
         */
        _this.sellDollar = function (amount, minGoldAmount) {
            return _this.exchange(amount, minGoldAmount, false);
        };
        /**
         * Returns the amount of cGLD a user would get for sellAmount of cUsd
         * @param sellAmount The amount of cUsd the user is selling to the exchange
         * @return The corresponding cGLD amount.
         */
        _this.quoteUsdSell = function (sellAmount) { return _this.getBuyTokenAmount(sellAmount, false); };
        /**
         * Returns the amount of cUsd a user would get for sellAmount of cGLD
         * @param sellAmount The amount of cGLD the user is selling to the exchange
         * @return The corresponding cUsd amount.
         */
        _this.quoteGoldSell = function (sellAmount) { return _this.getBuyTokenAmount(sellAmount, true); };
        /**
         * Returns the amount of cGLD a user would need to exchange to receive buyAmount of
         * cUsd.
         * @param buyAmount The amount of cUsd the user would like to purchase.
         * @return The corresponding cGLD amount.
         */
        _this.quoteUsdBuy = function (buyAmount) { return _this.getSellTokenAmount(buyAmount, false); };
        /**
         * Returns the amount of cUsd a user would need to exchange to receive buyAmount of
         * cGLD.
         * @param buyAmount The amount of cGLD the user would like to purchase.
         * @return The corresponding cUsd amount.
         */
        _this.quoteGoldBuy = function (buyAmount) { return _this.getSellTokenAmount(buyAmount, true); };
        /**
         * Returns the exchange rate for cUsd estimated at the buyAmount
         * @param buyAmount The amount of cUsd in wei to estimate the exchange rate at
         * @return The exchange rate (number of cGLD received for one cUsd)
         */
        _this.getUsdExchangeRate = function (buyAmount) { return _this.getExchangeRate(buyAmount, false); };
        /**
         * Returns the exchange rate for cGLD estimated at the buyAmount
         * @param buyAmount The amount of cGLD in wei to estimate the exchange rate at
         * @return The exchange rate (number of cUsd received for one cGLD)
         */
        _this.getGoldExchangeRate = function (buyAmount) { return _this.getExchangeRate(buyAmount, true); };
        return _this;
    }
    /**
     * @dev Returns the amount of buyToken a user would get for sellAmount of sellToken
     * @param sellAmount The amount of sellToken the user is selling to the exchange
     * @param sellGold `true` if gold is the sell token
     * @return The corresponding buyToken amount.
     */
    ExchangeWrapper.prototype.getBuyTokenAmount = function (sellAmount, sellGold) {
        return __awaiter(this, void 0, void 0, function () {
            var sell, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sell = BaseWrapper_1.valueToString(sellAmount);
                        if (new bignumber_js_1.default(sell).eq(0)) {
                            return [2 /*return*/, new bignumber_js_1.default(0)];
                        }
                        return [4 /*yield*/, this.contract.methods.getBuyTokenAmount(sell, sellGold).call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.valueToBigNumber(res)];
                }
            });
        });
    };
    /**
     * Returns the amount of sellToken a user would need to exchange to receive buyAmount of
     * buyToken.
     * @param buyAmount The amount of buyToken the user would like to purchase.
     * @param sellGold `true` if gold is the sell token
     * @return The corresponding sellToken amount.
     */
    ExchangeWrapper.prototype.getSellTokenAmount = function (buyAmount, sellGold) {
        return __awaiter(this, void 0, void 0, function () {
            var buy, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        buy = BaseWrapper_1.valueToString(buyAmount);
                        if (new bignumber_js_1.default(buy).eq(0)) {
                            return [2 /*return*/, new bignumber_js_1.default(0)];
                        }
                        return [4 /*yield*/, this.contract.methods.getSellTokenAmount(buy, sellGold).call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.valueToBigNumber(res)];
                }
            });
        });
    };
    /**
     * @dev Returns the current configuration of the exchange contract
     * @return ExchangeConfig object
     */
    ExchangeWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.spread(),
                            this.reserveFraction(),
                            this.updateFrequency(),
                            this.minimumReports(),
                            this.lastBucketUpdate(),
                        ])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                spread: res[0],
                                reserveFraction: res[1],
                                updateFrequency: res[2],
                                minimumReports: res[3],
                                lastBucketUpdate: res[4],
                            }];
                }
            });
        });
    };
    /**
     * Returns the exchange rate estimated at buyAmount.
     * @param buyAmount The amount of buyToken in wei to estimate the exchange rate at
     * @param sellGold `true` if gold is the sell token
     * @return The exchange rate (number of sellTokens received for one buyToken).
     */
    ExchangeWrapper.prototype.getExchangeRate = function (buyAmount, sellGold) {
        return __awaiter(this, void 0, void 0, function () {
            var takerAmount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getBuyTokenAmount(buyAmount, sellGold)];
                    case 1:
                        takerAmount = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.valueToFrac(buyAmount, takerAmount)]; // Number of sellTokens received for one buyToken
                }
            });
        });
    };
    return ExchangeWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.ExchangeWrapper = ExchangeWrapper;
//# sourceMappingURL=Exchange.js.map