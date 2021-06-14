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
var address_1 = require("@celo/utils/lib/address");
var debug_1 = __importDefault(require("debug"));
var web3_1 = __importDefault(require("web3"));
var celo_provider_1 = require("../providers/celo-provider");
var signing_utils_1 = require("./signing-utils");
var debug = debug_1.default('kit:txtest:sign');
// Random private keys
var PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
var ACCOUNT_ADDRESS1 = address_1.privateKeyToAddress(PRIVATE_KEY1);
var PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc';
var ACCOUNT_ADDRESS2 = address_1.privateKeyToAddress(PRIVATE_KEY2);
debug("Private key 1: " + PRIVATE_KEY1);
debug("Account Address 1: " + ACCOUNT_ADDRESS1);
debug("Private key 2: " + PRIVATE_KEY2);
debug("Account Address 2: " + ACCOUNT_ADDRESS2);
function verifyLocalSigning(web3, celoTransaction) {
    return __awaiter(this, void 0, void 0, function () {
        var signedTransaction, rawTransaction, _a, signedCeloTransaction, recoveredSigner;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    debug('Signer Testing using Account: %s', celoTransaction.from);
                    return [4 /*yield*/, web3.eth.signTransaction(celoTransaction)];
                case 1:
                    signedTransaction = _b.sent();
                    debug('Singer Testing: Signed transaction %o', signedTransaction);
                    rawTransaction = signedTransaction.raw;
                    _a = signing_utils_1.recoverTransaction(rawTransaction), signedCeloTransaction = _a[0], recoveredSigner = _a[1];
                    debug('Transaction was signed by "%s", recovered signer is "%s"', celoTransaction.from, recoveredSigner);
                    expect(recoveredSigner.toLowerCase()).toEqual(celoTransaction.from.toString().toLowerCase());
                    if (celoTransaction.nonce != null) {
                        debug('Checking nonce actual: %o expected: %o', signedCeloTransaction.nonce, parseInt(celoTransaction.nonce.toString(), 16));
                        expect(signedCeloTransaction.nonce).toEqual(parseInt(celoTransaction.nonce.toString(), 16));
                    }
                    if (celoTransaction.gas != null) {
                        debug('Checking gas actual %o expected %o', signedCeloTransaction.gas, parseInt(celoTransaction.gas.toString(), 16));
                        expect(signedCeloTransaction.gas).toEqual(parseInt(celoTransaction.gas.toString(), 16));
                    }
                    if (celoTransaction.gasPrice != null) {
                        debug('Checking gas price actual %o expected %o', signedCeloTransaction.gasPrice, parseInt(celoTransaction.gasPrice.toString(), 16));
                        expect(signedCeloTransaction.gasPrice).toEqual(parseInt(celoTransaction.gasPrice.toString(), 16));
                    }
                    if (celoTransaction.feeCurrency != null) {
                        debug('Checking fee currency actual %o expected %o', signedCeloTransaction.feeCurrency, celoTransaction.feeCurrency);
                        expect(signedCeloTransaction.feeCurrency.toLowerCase()).toEqual(celoTransaction.feeCurrency.toLowerCase());
                    }
                    if (celoTransaction.gatewayFeeRecipient != null) {
                        debug('Checking gateway fee recipient actual ' +
                            (signedCeloTransaction.gatewayFeeRecipient + " expected " + celoTransaction.gatewayFeeRecipient));
                        expect(signedCeloTransaction.gatewayFeeRecipient.toLowerCase()).toEqual(celoTransaction.gatewayFeeRecipient.toLowerCase());
                    }
                    if (celoTransaction.gatewayFee != null) {
                        debug('Checking gateway fee value actual %o expected %o', signedCeloTransaction.gatewayFee, celoTransaction.gatewayFee.toString());
                        expect(signedCeloTransaction.gatewayFee).toEqual(celoTransaction.gatewayFee.toString());
                    }
                    if (celoTransaction.data != null) {
                        debug("Checking data actual " + signedCeloTransaction.data + " expected " + celoTransaction.data);
                        expect(signedCeloTransaction.data.toLowerCase()).toEqual(celoTransaction.data.toLowerCase());
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function verifyLocalSigningInAllPermutations(web3, from, to) {
    return __awaiter(this, void 0, void 0, function () {
        var amountInWei, nonce, badNonce, gas, gasPrice, feeCurrency, gatewayFeeRecipient, gatewayFee, data, chainId, i, celoTransaction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    amountInWei = web3_1.default.utils.toWei('1', 'ether');
                    nonce = 0;
                    badNonce = 100;
                    gas = 10;
                    gasPrice = 99;
                    feeCurrency = '0x124356';
                    gatewayFeeRecipient = '0x1234';
                    gatewayFee = '0x5678';
                    data = '0xabcdef';
                    chainId = 1;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 16)) return [3 /*break*/, 4];
                    celoTransaction = {
                        from: from,
                        to: to,
                        value: amountInWei,
                        nonce: nonce,
                        gasPrice: gasPrice,
                        chainId: chainId,
                        gas: gas,
                        feeCurrency: i & 1 ? feeCurrency : undefined,
                        gatewayFeeRecipient: i & 2 ? gatewayFeeRecipient : undefined,
                        gatewayFee: i & 4 ? gatewayFee : undefined,
                        data: i & 8 ? data : undefined,
                    };
                    return [4 /*yield*/, verifyLocalSigning(web3, celoTransaction)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: 
                // tslint:enable:no-bitwise
                // A special case.
                // An incorrect nonce  will only work, if no implict calls to estimate gas are required.
                return [4 /*yield*/, verifyLocalSigning(web3, { from: from, to: to, nonce: badNonce, gas: gas, gasPrice: gasPrice, chainId: chainId })];
                case 5:
                    // tslint:enable:no-bitwise
                    // A special case.
                    // An incorrect nonce  will only work, if no implict calls to estimate gas are required.
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// These tests verify the signTransaction WITHOUT the ParamsPopulator
describe('Transaction Utils', function () {
    // only needed for the eth_coinbase rcp call
    var celoProvider;
    var mockProvider = {
        host: '',
        connected: true,
        send: function (payload, callback) {
            if (payload.method === 'eth_coinbase') {
                var response = {
                    jsonrpc: payload.jsonrpc,
                    id: Number(payload.id),
                    result: '0xc94770007dda54cF92009BFF0dE90c06F603a09f',
                };
                callback(null, response);
            }
            else {
                callback(new Error(payload.method));
            }
        },
        supportsSubscriptions: function () { return true; },
        disconnect: function () { return true; },
    };
    var web3 = new web3_1.default();
    beforeEach(function () {
        celoProvider = new celo_provider_1.CeloProvider(mockProvider);
        web3.setProvider(celoProvider);
    });
    afterEach(function () {
        if (web3.currentProvider instanceof celo_provider_1.CeloProvider) {
            web3.currentProvider.stop();
        }
    });
    describe('Signer Testing with single local account and pay gas in Celo Gold', function () {
        it('Test1 should be able to sign and get the signer back with single local account', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jest.setTimeout(60 * 1000);
                        celoProvider.addAccount(PRIVATE_KEY1);
                        return [4 /*yield*/, verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('Signer Testing with multiple local accounts', function () {
        it('Test2 should be able to sign with first account and get the signer back with multiple local accounts', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jest.setTimeout(60 * 1000);
                        celoProvider.addAccount(PRIVATE_KEY1);
                        celoProvider.addAccount(PRIVATE_KEY2);
                        return [4 /*yield*/, verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('Test3 should be able to sign with second account and get the signer back with multiple local accounts', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jest.setTimeout(60 * 1000);
                        celoProvider.addAccount(PRIVATE_KEY1);
                        celoProvider.addAccount(PRIVATE_KEY2);
                        return [4 /*yield*/, verifyLocalSigningInAllPermutations(web3, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS1)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=tx-signing.test.js.map