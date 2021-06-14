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
var fixidity_1 = require("@celo/utils/lib/fixidity");
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Stable token with variable supply (cUSD)
 */
var StableTokenWrapper = /** @class */ (function (_super) {
    __extends(StableTokenWrapper, _super);
    function StableTokenWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Gets the amount of owner's StableToken allowed to be spent by spender.
         * @param accountOwner The owner of the StableToken.
         * @param spender The spender of the StableToken.
         * @return The amount of StableToken owner is allowing spender to spend.
         */
        _this.allowance = BaseWrapper_1.proxyCall(_this.contract.methods.allowance, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * @return The name of the stable token.
         */
        _this.name = BaseWrapper_1.proxyCall(_this.contract.methods.name);
        /**
         * @return The symbol of the stable token.
         */
        _this.symbol = BaseWrapper_1.proxyCall(_this.contract.methods.symbol);
        /**
         * @return The number of decimal places to which StableToken is divisible.
         */
        _this.decimals = BaseWrapper_1.proxyCall(_this.contract.methods.decimals, undefined, BaseWrapper_1.valueToInt);
        /**
         * Returns the total supply of the token, that is, the amount of tokens currently minted.
         * @returns Total supply.
         */
        _this.totalSupply = BaseWrapper_1.proxyCall(_this.contract.methods.totalSupply, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Gets the balance of the specified address using the presently stored inflation factor.
         * @param owner The address to query the balance of.
         * @return The balance of the specified address.
         */
        _this.balanceOf = BaseWrapper_1.proxyCall(_this.contract.methods.balanceOf, undefined, BaseWrapper_1.valueToBigNumber);
        _this.owner = BaseWrapper_1.proxyCall(_this.contract.methods.owner);
        /**
         * Returns the units for a given value given the current inflation factor.
         * @param value The value to convert to units.
         * @return The units corresponding to `value` given the current inflation factor.
         * @dev We don't compute the updated inflationFactor here because
         * we assume any function calling this will have updated the inflation factor.
         */
        _this.valueToUnits = BaseWrapper_1.proxyCall(_this.contract.methods.valueToUnits, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString), BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the value of a given number of units given the current inflation factor.
         * @param units The units to convert to value.
         * @return The value corresponding to `units` given the current inflation factor.
         */
        _this.unitsToValue = BaseWrapper_1.proxyCall(_this.contract.methods.unitsToValue, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString), BaseWrapper_1.valueToBigNumber);
        /**
         * Increases the allowance of another user.
         * @param spender The address which is being approved to spend StableToken.
         * @param value The increment of the amount of StableToken approved to the spender.
         * @returns true if success.
         */
        _this.increaseAllowance = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.increaseAllowance, BaseWrapper_1.tupleParser(BaseWrapper_1.stringIdentity, BaseWrapper_1.valueToString));
        /**
         * Decreases the allowance of another user.
         * @param spender The address which is being approved to spend StableToken.
         * @param value The decrement of the amount of StableToken approved to the spender.
         * @returns true if success.
         */
        _this.decreaseAllowance = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.decreaseAllowance);
        _this.mint = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.mint);
        _this.burn = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.burn);
        _this.setInflationParameters = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setInflationParameters);
        /**
         * Approve a user to transfer StableToken on behalf of another user.
         * @param spender The address which is being approved to spend StableToken.
         * @param value The amount of StableToken approved to the spender.
         * @return True if the transaction succeeds.
         */
        _this.approve = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.approve);
        /**
         * Transfer token for a specified address
         * @param to The address to transfer to.
         * @param value The amount to be transferred.
         * @param comment The transfer comment.
         * @return True if the transaction succeeds.
         */
        _this.transferWithComment = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transferWithComment);
        /**
         * Transfers `value` from `msg.sender` to `to`
         * @param to The address to transfer to.
         * @param value The amount to be transferred.
         */
        _this.transfer = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transfer);
        /**
         * Transfers StableToken from one address to another on behalf of a user.
         * @param from The address to transfer StableToken from.
         * @param to The address to transfer StableToken to.
         * @param value The amount of StableToken to transfer.
         * @return True if the transaction succeeds.
         */
        _this.transferFrom = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transferFrom);
        return _this;
    }
    /**
     * Querying the inflation parameters.
     * @returns Inflation rate, inflation factor, inflation update period and the last time factor was updated.
     */
    StableTokenWrapper.prototype.getInflationParameters = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getInflationParameters().call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                rate: fixidity_1.fromFixed(BaseWrapper_1.valueToBigNumber(res[0])),
                                factor: fixidity_1.fromFixed(BaseWrapper_1.valueToBigNumber(res[1])),
                                updatePeriod: BaseWrapper_1.valueToBigNumber(res[2]),
                                factorLastUpdated: BaseWrapper_1.valueToBigNumber(res[3]),
                            }];
                }
            });
        });
    };
    /**
     * Returns current configuration parameters.
     */
    StableTokenWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.name(),
                            this.symbol(),
                            this.decimals(),
                            this.getInflationParameters(),
                        ])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                name: res[0],
                                symbol: res[1],
                                decimals: res[2],
                                inflationParameters: res[3],
                            }];
                }
            });
        });
    };
    return StableTokenWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.StableTokenWrapper = StableTokenWrapper;
//# sourceMappingURL=StableTokenWrapper.js.map