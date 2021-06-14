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
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Contract for handling reserve for stable currencies
 */
var ReserveWrapper = /** @class */ (function (_super) {
    __extends(ReserveWrapper, _super);
    function ReserveWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Query Tobin tax staleness threshold parameter.
         * @returns Current Tobin tax staleness threshold.
         */
        _this.tobinTaxStalenessThreshold = BaseWrapper_1.proxyCall(_this.contract.methods.tobinTaxStalenessThreshold, undefined, BaseWrapper_1.valueToBigNumber);
        _this.isSpender = BaseWrapper_1.proxyCall(_this.contract.methods.isSpender);
        _this.transferGold = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transferGold);
        _this.getOrComputeTobinTax = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.getOrComputeTobinTax);
        _this.frozenReserveGoldStartBalance = BaseWrapper_1.proxyCall(_this.contract.methods.frozenReserveGoldStartBalance, undefined, BaseWrapper_1.valueToBigNumber);
        _this.frozenReserveGoldStartDay = BaseWrapper_1.proxyCall(_this.contract.methods.frozenReserveGoldStartDay, undefined, BaseWrapper_1.valueToBigNumber);
        _this.frozenReserveGoldDays = BaseWrapper_1.proxyCall(_this.contract.methods.frozenReserveGoldDays, undefined, BaseWrapper_1.valueToBigNumber);
        _this.getReserveGoldBalance = BaseWrapper_1.proxyCall(_this.contract.methods.getReserveGoldBalance, undefined, BaseWrapper_1.valueToBigNumber);
        _this.getOtherReserveAddresses = BaseWrapper_1.proxyCall(_this.contract.methods.getOtherReserveAddresses);
        _this.isOtherReserveAddress = BaseWrapper_1.proxyCall(_this.contract.methods.isOtherReserveAddress);
        return _this;
    }
    /**
     * Returns current configuration parameters.
     */
    ReserveWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {};
                        return [4 /*yield*/, this.tobinTaxStalenessThreshold()];
                    case 1:
                        _a.tobinTaxStalenessThreshold = _b.sent();
                        return [4 /*yield*/, this.frozenReserveGoldStartBalance()];
                    case 2:
                        _a.frozenReserveGoldStartBalance = _b.sent();
                        return [4 /*yield*/, this.frozenReserveGoldStartDay()];
                    case 3:
                        _a.frozenReserveGoldStartDay = _b.sent();
                        return [4 /*yield*/, this.frozenReserveGoldDays()];
                    case 4:
                        _a.frozenReserveGoldDays = _b.sent();
                        return [4 /*yield*/, this.getOtherReserveAddresses()];
                    case 5: return [2 /*return*/, (_a.otherReserveAddresses = _b.sent(),
                            _a)];
                }
            });
        });
    };
    ReserveWrapper.prototype.getSpenders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var spendersAdded, spendersRemoved;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPastEvents('SpenderAdded', {
                            fromBlock: 0,
                            toBlock: 'latest',
                        })];
                    case 1:
                        spendersAdded = (_a.sent()).map(function (eventlog) { return eventlog.returnValues.spender; });
                        return [4 /*yield*/, this.getPastEvents('SpenderRemoved', {
                                fromBlock: 0,
                                toBlock: 'latest',
                            })];
                    case 2:
                        spendersRemoved = (_a.sent()).map(function (eventlog) { return eventlog.returnValues.spender; });
                        return [2 /*return*/, spendersAdded.filter(function (spender) { return !spendersRemoved.includes(spender); })];
                }
            });
        });
    };
    return ReserveWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.ReserveWrapper = ReserveWrapper;
//# sourceMappingURL=Reserve.js.map