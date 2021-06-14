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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var provider_utils_1 = require("../utils/provider-utils");
var rpc_caller_1 = require("../utils/rpc-caller");
var tx_params_normalizer_1 = require("../utils/tx-params-normalizer");
var local_wallet_1 = require("../wallets/local-wallet");
var debug = debug_1.default('kit:provider:connection');
var debugPayload = debug_1.default('kit:provider:payload');
var debugResponse = debug_1.default('kit:provider:response');
var InterceptedMethods;
(function (InterceptedMethods) {
    InterceptedMethods["accounts"] = "eth_accounts";
    InterceptedMethods["sendTransaction"] = "eth_sendTransaction";
    InterceptedMethods["signTransaction"] = "eth_signTransaction";
    InterceptedMethods["sign"] = "eth_sign";
    InterceptedMethods["personalSign"] = "personal_sign";
    InterceptedMethods["signTypedData"] = "eth_signTypedData";
})(InterceptedMethods || (InterceptedMethods = {}));
var CeloProvider = /** @class */ (function () {
    function CeloProvider(existingProvider, wallet) {
        if (wallet === void 0) { wallet = new local_wallet_1.LocalWallet(); }
        this.existingProvider = existingProvider;
        this.alreadyStopped = false;
        this.rpcCaller = new rpc_caller_1.DefaultRpcCaller(existingProvider);
        this.paramsPopulator = new tx_params_normalizer_1.TxParamsNormalizer(this.rpcCaller);
        this.wallet = wallet;
        this.addProviderDelegatedFunctions();
    }
    CeloProvider.prototype.addAccount = function (privateKey) {
        if (provider_utils_1.hasProperty(this.wallet, 'addAccount')) {
            this.wallet.addAccount(privateKey);
        }
        else {
            throw new Error("The wallet used, can't add accounts");
        }
    };
    CeloProvider.prototype.getAccounts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var nodeAccountsResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.rpcCaller.call('eth_accounts', [])];
                    case 1:
                        nodeAccountsResp = _a.sent();
                        return [2 /*return*/, nodeAccountsResp.result.concat(this.wallet.getAccounts())];
                }
            });
        });
    };
    CeloProvider.prototype.isLocalAccount = function (address) {
        return this.wallet.hasAccount(address);
    };
    /**
     * Send method as expected by web3.js
     */
    CeloProvider.prototype.send = function (payload, callback) {
        var txParams;
        var address;
        debugPayload('%O', payload);
        var decoratedCallback = (function (error, result) {
            debugResponse('%O', result);
            callback(error, result);
        });
        if (this.alreadyStopped) {
            throw Error('CeloProvider already stopped');
        }
        switch (payload.method) {
            case InterceptedMethods.accounts: {
                rpc_caller_1.rpcCallHandler(payload, this.handleAccounts.bind(this), decoratedCallback);
                return;
            }
            case InterceptedMethods.sendTransaction: {
                this.checkPayloadWithAtLeastNParams(payload, 1);
                txParams = payload.params[0];
                if (this.isLocalAccount(txParams.from)) {
                    rpc_caller_1.rpcCallHandler(payload, this.handleSendTransaction.bind(this), decoratedCallback);
                }
                else {
                    this.forwardSend(payload, callback);
                }
                return;
            }
            case InterceptedMethods.signTransaction: {
                this.checkPayloadWithAtLeastNParams(payload, 1);
                txParams = payload.params[0];
                if (this.isLocalAccount(txParams.from)) {
                    rpc_caller_1.rpcCallHandler(payload, this.handleSignTransaction.bind(this), decoratedCallback);
                }
                else {
                    this.forwardSend(payload, callback);
                }
                return;
            }
            case InterceptedMethods.sign:
            case InterceptedMethods.personalSign: {
                if (payload.method === InterceptedMethods.sign) {
                    this.checkPayloadWithAtLeastNParams(payload, 1);
                }
                else {
                    this.checkPayloadWithAtLeastNParams(payload, 2);
                }
                address = payload.method === InterceptedMethods.sign ? payload.params[0] : payload.params[1];
                if (this.isLocalAccount(address)) {
                    rpc_caller_1.rpcCallHandler(payload, this.handleSignPersonalMessage.bind(this), decoratedCallback);
                }
                else {
                    this.forwardSend(payload, callback);
                }
                return;
            }
            case InterceptedMethods.signTypedData: {
                this.checkPayloadWithAtLeastNParams(payload, 1);
                address = payload.params[0];
                if (this.isLocalAccount(address)) {
                    rpc_caller_1.rpcCallHandler(payload, this.handleSignTypedData.bind(this), decoratedCallback);
                }
                else {
                    this.forwardSend(payload, callback);
                }
                return;
            }
            default: {
                this.forwardSend(payload, callback);
                return;
            }
        }
    };
    CeloProvider.prototype.stop = function () {
        if (this.alreadyStopped) {
            return;
        }
        try {
            provider_utils_1.stopProvider(this.existingProvider);
            this.alreadyStopped = true;
        }
        catch (error) {
            debug("Failed to close the connection: " + error);
        }
    };
    CeloProvider.prototype.handleAccounts = function (_payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAccounts()];
            });
        });
    };
    CeloProvider.prototype.handleSignTypedData = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, address, typedData, signature;
            return __generator(this, function (_b) {
                _a = payload.params, address = _a[0], typedData = _a[1];
                signature = this.wallet.signTypedData(address, typedData);
                return [2 /*return*/, signature];
            });
        });
    };
    CeloProvider.prototype.handleSignPersonalMessage = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var address, data, ecSignatureHex;
            return __generator(this, function (_a) {
                address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1];
                data = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0];
                ecSignatureHex = this.wallet.signPersonalMessage(address, data);
                return [2 /*return*/, ecSignatureHex];
            });
        });
    };
    CeloProvider.prototype.handleSignTransaction = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var txParams, filledParams, signedTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        txParams = payload.params[0];
                        return [4 /*yield*/, this.paramsPopulator.populate(txParams)];
                    case 1:
                        filledParams = _a.sent();
                        return [4 /*yield*/, this.wallet.signTransaction(filledParams)];
                    case 2:
                        signedTx = _a.sent();
                        return [2 /*return*/, { raw: signedTx.raw, tx: txParams }];
                }
            });
        });
    };
    CeloProvider.prototype.handleSendTransaction = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var signedTx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.handleSignTransaction(payload)];
                    case 1:
                        signedTx = _a.sent();
                        return [4 /*yield*/, this.rpcCaller.call('eth_sendRawTransaction', [signedTx.raw])];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.result];
                }
            });
        });
    };
    CeloProvider.prototype.forwardSend = function (payload, callback) {
        this.rpcCaller.send(payload, callback);
    };
    CeloProvider.prototype.checkPayloadWithAtLeastNParams = function (payload, n) {
        if (!payload.params || payload.params.length < n) {
            throw Error('Invalid params');
        }
    };
    // Functions required to act as a delefator for the existingProvider
    CeloProvider.prototype.addProviderDelegatedFunctions = function () {
        if (provider_utils_1.hasProperty(this.existingProvider, 'on')) {
            // @ts-ignore
            this.on = this.defaultOn;
        }
        if (provider_utils_1.hasProperty(this.existingProvider, 'once')) {
            // @ts-ignore
            this.once = this.defaultOnce;
        }
        if (provider_utils_1.hasProperty(this.existingProvider, 'removeListener')) {
            // @ts-ignore
            this.removeListener = this.defaultRemoveListener;
        }
        if (provider_utils_1.hasProperty(this.existingProvider, 'removeAllListener')) {
            // @ts-ignore
            this.removeAllListener = this.defaultRemoveAllListeners;
        }
        if (provider_utils_1.hasProperty(this.existingProvider, 'reset')) {
            // @ts-ignore
            this.reset = this.defaultReset;
        }
    };
    Object.defineProperty(CeloProvider.prototype, "connected", {
        get: function () {
            return this.existingProvider.connected;
        },
        enumerable: true,
        configurable: true
    });
    CeloProvider.prototype.supportsSubscriptions = function () {
        return this.existingProvider.supportsSubscriptions();
    };
    CeloProvider.prototype.defaultOn = function (type, callback) {
        ;
        this.existingProvider.on(type, callback);
    };
    CeloProvider.prototype.defaultOnce = function (type, callback) {
        ;
        this.existingProvider.once(type, callback);
    };
    CeloProvider.prototype.defaultRemoveListener = function (type, callback) {
        ;
        this.existingProvider.removeListener(type, callback);
    };
    CeloProvider.prototype.defaultRemoveAllListeners = function (type) {
        ;
        this.existingProvider.removeAllListeners(type);
    };
    CeloProvider.prototype.defaultReset = function () {
        ;
        this.existingProvider.reset();
    };
    return CeloProvider;
}());
exports.CeloProvider = CeloProvider;
//# sourceMappingURL=celo-provider.js.map