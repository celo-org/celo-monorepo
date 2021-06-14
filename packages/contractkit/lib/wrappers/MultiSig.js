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
 * Contract for handling multisig actions
 */
var MultiSigWrapper = /** @class */ (function (_super) {
    __extends(MultiSigWrapper, _super);
    function MultiSigWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isowner = BaseWrapper_1.proxyCall(_this.contract.methods.isOwner);
        _this.getOwners = BaseWrapper_1.proxyCall(_this.contract.methods.getOwners);
        _this.getRequired = BaseWrapper_1.proxyCall(_this.contract.methods.required, undefined, BaseWrapper_1.valueToBigNumber);
        _this.getInternalRequired = BaseWrapper_1.proxyCall(_this.contract.methods.internalRequired, undefined, BaseWrapper_1.valueToBigNumber);
        _this.getTransactionCount = BaseWrapper_1.proxyCall(_this.contract.methods.transactionCount, undefined, BaseWrapper_1.valueToInt);
        _this.replaceOwner = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.replaceOwner, BaseWrapper_1.tupleParser(BaseWrapper_1.stringIdentity, BaseWrapper_1.stringIdentity));
        return _this;
    }
    /**
     * Allows an owner to submit and confirm a transaction.
     * If an unexecuted transaction matching `txObject` exists on the multisig, adds a confirmation to that tx ID.
     * Otherwise, submits the `txObject` to the multisig and add confirmation.
     * @param index The index of the pending withdrawal to withdraw.
     */
    MultiSigWrapper.prototype.submitOrConfirmTransaction = function (destination, txObject, value) {
        if (value === void 0) { value = '0'; }
        return __awaiter(this, void 0, void 0, function () {
            var data, transactionCount, transactionId, transaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = BaseWrapper_1.stringToSolidityBytes(txObject.encodeABI());
                        return [4 /*yield*/, this.contract.methods.getTransactionCount(true, true).call()];
                    case 1:
                        transactionCount = _a.sent();
                        transactionId = Number(transactionCount) - 1;
                        _a.label = 2;
                    case 2:
                        if (!(transactionId >= 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.contract.methods.transactions(transactionId).call()];
                    case 3:
                        transaction = _a.sent();
                        if (transaction.data === data &&
                            transaction.destination === destination &&
                            transaction.value === value &&
                            !transaction.executed) {
                            return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.confirmTransaction(transactionId))];
                        }
                        _a.label = 4;
                    case 4:
                        transactionId--;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.submitTransaction(destination, value, data))];
                }
            });
        });
    };
    MultiSigWrapper.prototype.getTransaction = function (i) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, destination, value, data, executed, confirmations, _i, _b, e;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.contract.methods
                            .transactions(i)
                            .call()];
                    case 1:
                        _a = _c.sent(), destination = _a.destination, value = _a.value, data = _a.data, executed = _a.executed;
                        confirmations = [];
                        _i = 0;
                        return [4 /*yield*/, this.getOwners()];
                    case 2:
                        _b = _c.sent();
                        _c.label = 3;
                    case 3:
                        if (!(_i < _b.length)) return [3 /*break*/, 6];
                        e = _b[_i];
                        return [4 /*yield*/, this.contract.methods.confirmations(i, e).call()];
                    case 4:
                        if (_c.sent()) {
                            confirmations.push(e);
                        }
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, {
                            destination: destination,
                            data: data,
                            executed: executed,
                            confirmations: confirmations,
                            value: new bignumber_js_1.default(value),
                        }];
                }
            });
        });
    };
    MultiSigWrapper.prototype.getTransactions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var txcount, res, i, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getTransactionCount()];
                    case 1:
                        txcount = _c.sent();
                        res = [];
                        i = 0;
                        _c.label = 2;
                    case 2:
                        if (!(i < txcount)) return [3 /*break*/, 5];
                        _b = (_a = res).push;
                        return [4 /*yield*/, this.getTransaction(i)];
                    case 3:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, res];
                }
            });
        });
    };
    return MultiSigWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.MultiSigWrapper = MultiSigWrapper;
//# sourceMappingURL=MultiSig.js.map