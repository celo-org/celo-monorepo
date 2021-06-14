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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var subproviders_1 = require("@0x/subproviders");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var debug_1 = __importDefault(require("debug"));
var web3_1 = __importDefault(require("web3"));
var signing_utils_1 = require("../utils/signing-utils");
var debug = debug_1.default('kit:providers:celo-private-keys-subprovider');
// Same as geth
// https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/internal/ethapi/api.go#L1222
var DefaultGasLimit = 90000;
// Default gateway fee to send the serving full-node on each transaction.
// TODO(nategraf): Provide a method of fecthing the gateway fee value from the full-node peer.
var DefaultGatewayFee = new bignumber_js_1.default(10000);
function getPrivateKeyWithout0xPrefix(privateKey) {
    return privateKey.toLowerCase().startsWith('0x') ? privateKey.substring(2) : privateKey;
}
function generateAccountAddressFromPrivateKey(privateKey) {
    if (!privateKey.toLowerCase().startsWith('0x')) {
        privateKey = '0x' + privateKey;
    }
    return new web3_1.default().eth.accounts.privateKeyToAccount(privateKey).address;
}
exports.generateAccountAddressFromPrivateKey = generateAccountAddressFromPrivateKey;
function isEmpty(value) {
    return (value === undefined ||
        value === null ||
        value === '0' ||
        value.toLowerCase() === '0x' ||
        value.toLowerCase() === '0x0');
}
/**
 * This class supports storing multiple private keys for signing.
 * The base class PrivateKeyWalletSubprovider only supports one key.
 */
var CeloPrivateKeysWalletProvider = /** @class */ (function (_super) {
    __extends(CeloPrivateKeysWalletProvider, _super);
    function CeloPrivateKeysWalletProvider(privateKey) {
        var _this = 
        // This won't accept a privateKey with 0x prefix and will call that an invalid key.
        _super.call(this, getPrivateKeyWithout0xPrefix(privateKey)) || this;
        _this.privateKey = privateKey;
        // Account addresses are hex-encoded, lower case alphabets
        _this.accountAddressToPrivateKey = new Map();
        _this.chainId = null;
        _this.gatewayFeeRecipient = null;
        _this.addAccount(privateKey);
        return _this;
    }
    CeloPrivateKeysWalletProvider.prototype.addAccount = function (privateKey) {
        // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
        privateKey = '0x' + getPrivateKeyWithout0xPrefix(privateKey);
        var accountAddress = generateAccountAddressFromPrivateKey(privateKey).toLowerCase();
        if (this.accountAddressToPrivateKey.has(accountAddress)) {
            debug('Accounts %o is already added', accountAddress);
            return;
        }
        this.accountAddressToPrivateKey.set(accountAddress, privateKey);
    };
    CeloPrivateKeysWalletProvider.prototype.getAccounts = function () {
        return Array.from(this.accountAddressToPrivateKey.keys());
    };
    // Over-riding parent class method
    CeloPrivateKeysWalletProvider.prototype.getAccountsAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAccounts()];
            });
        });
    };
    CeloPrivateKeysWalletProvider.prototype.handleRequest = function (payload, next, end) {
        return __awaiter(this, void 0, void 0, function () {
            var signingRequired, shouldPassToSuperClassForHandling;
            return __generator(this, function (_a) {
                signingRequired = [
                    'eth_sendTransaction',
                    'eth_signTransaction',
                    'eth_sign',
                    'personal_sign',
                    'eth_signTypedData',
                ].includes(payload.method);
                shouldPassToSuperClassForHandling = !signingRequired || this.canSign(payload.params[0].from);
                if (shouldPassToSuperClassForHandling) {
                    return [2 /*return*/, _super.prototype.handleRequest.call(this, payload, next, end)];
                }
                else {
                    // Pass it to the next handler to sign
                    next();
                }
                return [2 /*return*/];
            });
        });
    };
    CeloPrivateKeysWalletProvider.prototype.signTransactionAsync = function (txParamsInput) {
        return __awaiter(this, void 0, void 0, function () {
            var txParams, _a, _b, _c, _d, signedTx, rawTransaction;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        txParams = __assign({}, txParamsInput);
                        debug('signTransactionAsync: txParams are %o', txParams);
                        if (!this.canSign(txParams.from)) {
                            // If `handleRequest` works correctly then this code path should never trigger.
                            throw new Error("Transaction " + JSON.stringify(txParams) + " cannot be signed by any of accounts \"" + this.getAccounts() + "\"," +
                                (" it should be signed by \"" + txParams.from + "\""));
                        }
                        else {
                            debug("Signer is " + txParams.from + " and is one  of " + this.getAccounts());
                        }
                        if (!(txParams.chainId == null)) return [3 /*break*/, 2];
                        _a = txParams;
                        return [4 /*yield*/, this.getChainId()];
                    case 1:
                        _a.chainId = _e.sent();
                        _e.label = 2;
                    case 2:
                        if (!(txParams.nonce == null)) return [3 /*break*/, 4];
                        _b = txParams;
                        return [4 /*yield*/, this.getNonce(txParams.from)];
                    case 3:
                        _b.nonce = _e.sent();
                        _e.label = 4;
                    case 4:
                        if (!isEmpty(txParams.gatewayFeeRecipient)) return [3 /*break*/, 6];
                        _c = txParams;
                        return [4 /*yield*/, this.getCoinbase()];
                    case 5:
                        _c.gatewayFeeRecipient = _e.sent();
                        _e.label = 6;
                    case 6:
                        if (!isEmpty(txParams.gatewayFeeRecipient) && isEmpty(txParams.gatewayFee)) {
                            txParams.gatewayFee = DefaultGatewayFee.toString(16);
                        }
                        debug('Gateway fee for the transaction is %s paid to %s', txParams.gatewayFee, txParams.gatewayFeeRecipient);
                        if (!isEmpty(txParams.gasPrice)) return [3 /*break*/, 8];
                        _d = txParams;
                        return [4 /*yield*/, this.getGasPrice(txParams.feeCurrency)];
                    case 7:
                        _d.gasPrice = _e.sent();
                        _e.label = 8;
                    case 8:
                        debug('Gas price for the transaction is %s', txParams.gasPrice);
                        if (isEmpty(txParams.gas)) {
                            txParams.gas = String(DefaultGasLimit);
                        }
                        debug('Max gas fee for the transaction is %s', txParams.gas);
                        return [4 /*yield*/, signing_utils_1.signTransaction(txParams, this.getPrivateKeyFor(txParams.from))];
                    case 9:
                        signedTx = _e.sent();
                        rawTransaction = signedTx.rawTransaction.toString('hex');
                        return [2 /*return*/, rawTransaction];
                }
            });
        });
    };
    CeloPrivateKeysWalletProvider.prototype.canSign = function (from) {
        return this.accountAddressToPrivateKey.has(from.toLocaleLowerCase());
    };
    CeloPrivateKeysWalletProvider.prototype.getPrivateKeyFor = function (account) {
        var maybePk = this.accountAddressToPrivateKey.get(account.toLowerCase());
        if (maybePk == null) {
            throw new Error("tx-signing@getPrivateKey: ForPrivate key not found for " + account);
        }
        return maybePk;
    };
    CeloPrivateKeysWalletProvider.prototype.getChainId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.chainId === null)) return [3 /*break*/, 2];
                        debug('getChainId fetching chainId...');
                        return [4 /*yield*/, this.emitPayloadAsync({
                                method: 'net_version',
                                params: [],
                            })];
                    case 1:
                        result = _a.sent();
                        this.chainId = parseInt(result.result.toString(), 10);
                        debug('getChainId chain result ID is %s', this.chainId);
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.chainId];
                }
            });
        });
    };
    CeloPrivateKeysWalletProvider.prototype.getNonce = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var result, nonce;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        debug('getNonce fetching nonce...');
                        return [4 /*yield*/, this.emitPayloadAsync({
                                method: 'eth_getTransactionCount',
                                params: [address, 'pending'],
                            })];
                    case 1:
                        result = _a.sent();
                        nonce = result.result.toString();
                        debug('getNonce Nonce is %s', nonce);
                        return [2 /*return*/, nonce];
                }
            });
        });
    };
    CeloPrivateKeysWalletProvider.prototype.getCoinbase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.gatewayFeeRecipient === null)) return [3 /*break*/, 2];
                        debug('getCoinbase fetching Coinbase...');
                        return [4 /*yield*/, this.emitPayloadAsync({
                                method: 'eth_coinbase',
                                params: [],
                            })];
                    case 1:
                        result = _a.sent();
                        this.gatewayFeeRecipient = result.result.toString();
                        debug('getCoinbase gateway fee recipient is %s', this.gatewayFeeRecipient);
                        _a.label = 2;
                    case 2:
                        if (this.gatewayFeeRecipient == null) {
                            throw new Error("Coinbase is null, we are not connected to a full node, cannot sign transactions locally");
                        }
                        return [2 /*return*/, this.gatewayFeeRecipient];
                }
            });
        });
    };
    CeloPrivateKeysWalletProvider.prototype.getGasPrice = function (feeCurrency) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Gold Token
                if (!feeCurrency) {
                    return [2 /*return*/, this.getGasPriceInCeloGold()];
                }
                throw new Error("celo-private-keys-subprovider@getGasPrice: gas price for " +
                    ("currency " + feeCurrency + " cannot be computed in the CeloPrivateKeysWalletProvider, ") +
                    ' pass it explicitly');
            });
        });
    };
    CeloPrivateKeysWalletProvider.prototype.getGasPriceInCeloGold = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, gasPriceInHex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        debug('getGasPriceInCeloGold fetching gas price...');
                        return [4 /*yield*/, this.emitPayloadAsync({
                                method: 'eth_gasPrice',
                                params: [],
                            })];
                    case 1:
                        result = _a.sent();
                        gasPriceInHex = result.result.toString();
                        debug('getGasPriceInCeloGold gas price is %s', parseInt(gasPriceInHex.substr(2), 16));
                        return [2 /*return*/, gasPriceInHex];
                }
            });
        });
    };
    return CeloPrivateKeysWalletProvider;
}(subproviders_1.PrivateKeyWalletSubprovider));
exports.CeloPrivateKeysWalletProvider = CeloPrivateKeysWalletProvider;
//# sourceMappingURL=celo-private-keys-subprovider.js.map