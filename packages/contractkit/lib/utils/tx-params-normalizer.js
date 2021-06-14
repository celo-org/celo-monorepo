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
var web3_utils_1 = require("./web3-utils");
function isEmpty(value) {
    return (value === undefined ||
        value === null ||
        value === '0' ||
        value.toLowerCase() === '0x' ||
        value.toLowerCase() === '0x0');
}
var TxParamsNormalizer = /** @class */ (function () {
    function TxParamsNormalizer(rpcCaller) {
        this.rpcCaller = rpcCaller;
        this.chainId = null;
        this.gatewayFeeRecipient = null;
    }
    TxParamsNormalizer.prototype.populate = function (celoTxParams) {
        return __awaiter(this, void 0, void 0, function () {
            var txParams, _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        txParams = __assign({}, celoTxParams);
                        if (!(txParams.chainId == null)) return [3 /*break*/, 2];
                        _a = txParams;
                        return [4 /*yield*/, this.getChainId()];
                    case 1:
                        _a.chainId = _e.sent();
                        _e.label = 2;
                    case 2:
                        if (!(txParams.nonce == null)) return [3 /*break*/, 4];
                        _b = txParams;
                        return [4 /*yield*/, this.getNonce(txParams.from.toString())];
                    case 3:
                        _b.nonce = _e.sent();
                        _e.label = 4;
                    case 4:
                        if (!(!txParams.gas || isEmpty(txParams.gas.toString()))) return [3 /*break*/, 6];
                        _c = txParams;
                        return [4 /*yield*/, this.getEstimateGas(txParams)];
                    case 5:
                        _c.gas = _e.sent();
                        _e.label = 6;
                    case 6:
                        if (!(!txParams.gasPrice || isEmpty(txParams.gasPrice.toString()))) return [3 /*break*/, 8];
                        _d = txParams;
                        return [4 /*yield*/, this.getGasPrice(txParams.feeCurrency)];
                    case 7:
                        _d.gasPrice = _e.sent();
                        _e.label = 8;
                    case 8: return [2 /*return*/, txParams];
                }
            });
        });
    };
    TxParamsNormalizer.prototype.getChainId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.chainId === null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.rpcCaller.call('net_version', [])];
                    case 1:
                        result = _a.sent();
                        this.chainId = parseInt(result.result.toString(), 10);
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.chainId];
                }
            });
        });
    };
    TxParamsNormalizer.prototype.getNonce = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var result, nonce;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.rpcCaller.call('eth_getTransactionCount', [address, 'pending'])];
                    case 1:
                        result = _a.sent();
                        nonce = parseInt(result.result.toString(), 16);
                        return [2 /*return*/, nonce];
                }
            });
        });
    };
    TxParamsNormalizer.prototype.getEstimateGas = function (txParams) {
        return __awaiter(this, void 0, void 0, function () {
            var gasEstimator, caller;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gasEstimator = function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var gasResult;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.rpcCaller.call('eth_estimateGas', [tx])];
                                    case 1:
                                        gasResult = _a.sent();
                                        return [2 /*return*/, gasResult.result];
                                }
                            });
                        }); };
                        caller = function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var callResult;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.rpcCaller.call('eth_call', [tx])];
                                    case 1:
                                        callResult = _a.sent();
                                        return [2 /*return*/, callResult.result];
                                }
                            });
                        }); };
                        return [4 /*yield*/, web3_utils_1.estimateGas(txParams, gasEstimator, caller)];
                    case 1: return [2 /*return*/, (_a.sent()).toString()];
                }
            });
        });
    };
    // @ts-ignore - see comment above
    TxParamsNormalizer.prototype.getCoinbase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.gatewayFeeRecipient === null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.rpcCaller.call('eth_coinbase', [])];
                    case 1:
                        result = _a.sent();
                        this.gatewayFeeRecipient = result.result.toString();
                        _a.label = 2;
                    case 2:
                        if (this.gatewayFeeRecipient == null) {
                            throw new Error('missing-tx-params-populator@getCoinbase: Coinbase is null, we are not connected to a full ' +
                                'node, cannot sign transactions locally');
                        }
                        return [2 /*return*/, this.gatewayFeeRecipient];
                }
            });
        });
    };
    TxParamsNormalizer.prototype.getGasPrice = function (feeCurrency) {
        // Gold Token
        if (!feeCurrency) {
            return this.getGasPriceInCeloGold();
        }
        throw new Error("missing-tx-params-populator@getGasPrice: gas price for currency " + feeCurrency + " cannot be computed pass it explicitly");
    };
    TxParamsNormalizer.prototype.getGasPriceInCeloGold = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, gasPriceInHex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.rpcCaller.call('eth_gasPrice', [])];
                    case 1:
                        result = _a.sent();
                        gasPriceInHex = result.result.toString();
                        return [2 /*return*/, gasPriceInHex];
                }
            });
        });
    };
    return TxParamsNormalizer;
}());
exports.TxParamsNormalizer = TxParamsNormalizer;
//# sourceMappingURL=tx-params-normalizer.js.map