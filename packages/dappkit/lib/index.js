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
var utils_1 = require("@celo/utils");
var expo_1 = require("expo");
var utils_2 = require("@celo/utils/");
exports.AccountAuthRequest = utils_2.AccountAuthRequest;
exports.serializeDappKitRequestDeeplink = utils_2.serializeDappKitRequestDeeplink;
exports.SignTxRequest = utils_2.SignTxRequest;
function listenToAccount(callback) {
    return expo_1.Linking.addEventListener('url', function (_a) {
        var url = _a.url;
        try {
            var dappKitResponse = utils_1.parseDappkitResponseDeeplink(url);
            if (dappKitResponse.type === utils_1.DappKitRequestTypes.ACCOUNT_ADDRESS &&
                dappKitResponse.status === utils_1.DappKitResponseStatus.SUCCESS) {
                callback(dappKitResponse.address);
            }
        }
        catch (error) { }
    });
}
exports.listenToAccount = listenToAccount;
function waitForAccountAuth(requestId) {
    return new Promise(function (resolve, reject) {
        var handler = function (_a) {
            var url = _a.url;
            try {
                var dappKitResponse = utils_1.parseDappkitResponseDeeplink(url);
                if (requestId === dappKitResponse.requestId &&
                    dappKitResponse.type === utils_1.DappKitRequestTypes.ACCOUNT_ADDRESS &&
                    dappKitResponse.status === utils_1.DappKitResponseStatus.SUCCESS) {
                    expo_1.Linking.removeEventListener('url', handler);
                    resolve(dappKitResponse);
                }
            }
            catch (error) {
                reject(error);
            }
        };
        expo_1.Linking.addEventListener('url', handler);
    });
}
exports.waitForAccountAuth = waitForAccountAuth;
function waitForSignedTxs(requestId) {
    return new Promise(function (resolve, reject) {
        var handler = function (_a) {
            var url = _a.url;
            try {
                var dappKitResponse = utils_1.parseDappkitResponseDeeplink(url);
                if (requestId === dappKitResponse.requestId &&
                    dappKitResponse.type === utils_1.DappKitRequestTypes.SIGN_TX &&
                    dappKitResponse.status === utils_1.DappKitResponseStatus.SUCCESS) {
                    expo_1.Linking.removeEventListener('url', handler);
                    resolve(dappKitResponse);
                }
            }
            catch (error) {
                reject(error);
            }
        };
        expo_1.Linking.addEventListener('url', handler);
    });
}
exports.waitForSignedTxs = waitForSignedTxs;
function listenToSignedTxs(callback) {
    return expo_1.Linking.addEventListener('url', function (_a) {
        var url = _a.url;
        try {
            var dappKitResponse = utils_1.parseDappkitResponseDeeplink(url);
            if (dappKitResponse.type === utils_1.DappKitRequestTypes.SIGN_TX &&
                dappKitResponse.status === utils_1.DappKitResponseStatus.SUCCESS) {
                callback(dappKitResponse.rawTxs);
            }
        }
        catch (error) { }
    });
}
exports.listenToSignedTxs = listenToSignedTxs;
function requestAccountAddress(meta) {
    expo_1.Linking.openURL(utils_1.serializeDappKitRequestDeeplink(utils_1.AccountAuthRequest(meta)));
}
exports.requestAccountAddress = requestAccountAddress;
var FeeCurrency;
(function (FeeCurrency) {
    FeeCurrency["cUSD"] = "cUSD";
    FeeCurrency["cGLD"] = "cGLD";
})(FeeCurrency = exports.FeeCurrency || (exports.FeeCurrency = {}));
function getFeeCurrencyContractAddress(kit, feeCurrency) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (feeCurrency) {
                case FeeCurrency.cUSD:
                    return [2 /*return*/, kit.registry.addressFor(contractkit_1.CeloContract.StableToken)];
                case FeeCurrency.cGLD:
                    return [2 /*return*/, kit.registry.addressFor(contractkit_1.CeloContract.GoldToken)];
                default:
                    return [2 /*return*/, kit.registry.addressFor(contractkit_1.CeloContract.StableToken)];
            }
            return [2 /*return*/];
        });
    });
}
function requestTxSig(kit, txParams, meta) {
    return __awaiter(this, void 0, void 0, function () {
        var baseNonce, txs, request;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, kit.web3.eth.getTransactionCount(txParams[0].from)];
                case 1:
                    baseNonce = _a.sent();
                    return [4 /*yield*/, Promise.all(txParams.map(function (txParam, index) { return __awaiter(_this, void 0, void 0, function () {
                            var feeCurrency, feeCurrencyContractAddress, value, estimatedTxParams, estimatedGas, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        feeCurrency = txParam.feeCurrency ? txParam.feeCurrency : FeeCurrency.cGLD;
                                        return [4 /*yield*/, getFeeCurrencyContractAddress(kit, feeCurrency)];
                                    case 1:
                                        feeCurrencyContractAddress = _b.sent();
                                        value = txParam.value === undefined ? '0' : txParam.value;
                                        estimatedTxParams = {
                                            feeCurrency: feeCurrencyContractAddress,
                                            from: txParam.from,
                                            value: value,
                                        };
                                        if (!(txParam.estimatedGas === undefined)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, txParam.tx.estimateGas(estimatedTxParams)];
                                    case 2:
                                        _a = _b.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        _a = txParam.estimatedGas;
                                        _b.label = 4;
                                    case 4:
                                        estimatedGas = _a;
                                        return [2 /*return*/, __assign({ txData: txParam.tx.encodeABI(), estimatedGas: estimatedGas, nonce: baseNonce + index, feeCurrencyAddress: feeCurrencyContractAddress, value: value }, txParam)];
                                }
                            });
                        }); }))];
                case 2:
                    txs = _a.sent();
                    request = utils_1.SignTxRequest(txs, meta);
                    expo_1.Linking.openURL(utils_1.serializeDappKitRequestDeeplink(request));
                    return [2 /*return*/];
            }
        });
    });
}
exports.requestTxSig = requestTxSig;
//# sourceMappingURL=index.js.map