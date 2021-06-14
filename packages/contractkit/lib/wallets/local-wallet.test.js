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
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var web3_1 = __importDefault(require("web3"));
var signing_utils_1 = require("../utils/signing-utils");
var local_wallet_1 = require("./local-wallet");
var CHAIN_ID = 44378;
// Sample data from the official EIP-712 example:
// https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
var TYPED_DATA = {
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
        ],
        Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
        ],
    },
    primaryType: 'Mail',
    domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    message: {
        from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
    },
};
var PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
var ACCOUNT_ADDRESS1 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY1));
var PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc';
var ACCOUNT_ADDRESS2 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY2));
describe('Local wallet class', function () {
    var wallet;
    beforeEach(function () {
        wallet = new local_wallet_1.LocalWallet();
    });
    test('starts with no accounts', function () {
        expect(wallet.getAccounts().length).toBe(0);
    });
    test('fails if you add an invalid private key', function () {
        try {
            wallet.addAccount('this is not a valid private key');
            throw new Error('Expected exception to be thrown');
        }
        catch (e) {
            expect(e.message).toBe('private key length is invalid');
        }
    });
    test('succeeds if you add an private key without 0x', function () {
        wallet.addAccount(PRIVATE_KEY1);
        expect(wallet.hasAccount(ACCOUNT_ADDRESS1)).toBeTruthy();
    });
    test('succeeds if you add an private key with 0x', function () {
        wallet.addAccount(PRIVATE_KEY2);
        expect(wallet.hasAccount(ACCOUNT_ADDRESS2)).toBeTruthy();
    });
    describe('with an account', function () {
        var knownAddress = ACCOUNT_ADDRESS1;
        var otherAddress = ACCOUNT_ADDRESS2;
        beforeEach(function () {
            wallet.addAccount(PRIVATE_KEY1);
        });
        test('all address can be retrieved', function () {
            expect(wallet.getAccounts()).toMatchObject([ACCOUNT_ADDRESS1]);
        });
        describe('signing', function () {
            describe('using an unknown address', function () {
                var celoTransaction;
                var unknownAddress = ACCOUNT_ADDRESS2;
                beforeEach(function () {
                    celoTransaction = {
                        from: unknownAddress,
                        to: unknownAddress,
                        chainId: 2,
                        value: web3_1.default.utils.toWei('1', 'ether'),
                        nonce: 0,
                        gas: '10',
                        gasPrice: '99',
                        feeCurrency: '0x124356',
                        gatewayFeeRecipient: '0x1234',
                        gatewayFee: '0x5678',
                        data: '0xabcdef',
                    };
                });
                test('fails calling signTransaction', function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, expect(wallet.signTransaction(celoTransaction)).rejects.toThrowError()];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                test('fails calling signPersonalMessage', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var hexStr;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                hexStr = '0xa1';
                                return [4 /*yield*/, expect(wallet.signPersonalMessage(unknownAddress, hexStr)).rejects.toThrowError()];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                test('fails calling signTypedData', function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, expect(wallet.signTypedData(unknownAddress, TYPED_DATA)).rejects.toThrowError()];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
            });
            describe('using a known address', function () {
                describe('when calling signTransaction', function () {
                    var celoTransaction;
                    beforeEach(function () {
                        celoTransaction = {
                            from: knownAddress,
                            to: otherAddress,
                            chainId: CHAIN_ID,
                            value: web3_1.default.utils.toWei('1', 'ether'),
                            nonce: 0,
                            gas: '10',
                            gasPrice: '99',
                            feeCurrency: '0x',
                            gatewayFeeRecipient: '0x1234',
                            gatewayFee: '0x5678',
                            data: '0xabcdef',
                        };
                    });
                    test('succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, expect(wallet.signTransaction(celoTransaction)).resolves.not.toBeUndefined()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    test('with same signer', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var signedTx, _a, recoveredSigner;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, wallet.signTransaction(celoTransaction)];
                                case 1:
                                    signedTx = _b.sent();
                                    _a = signing_utils_1.recoverTransaction(signedTx.raw), recoveredSigner = _a[1];
                                    expect(address_1.normalizeAddressWith0x(recoveredSigner)).toBe(address_1.normalizeAddressWith0x(knownAddress));
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    // https://github.com/ethereum/go-ethereum/blob/38aab0aa831594f31d02c9f02bfacc0bef48405d/rlp/decode.go#L664
                    test('signature with 0x00 prefix is canonicalized', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var celoTransactionZeroPrefix, signedTx, _a, recoveredSigner;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    celoTransactionZeroPrefix = {
                                        from: ACCOUNT_ADDRESS1,
                                        to: ACCOUNT_ADDRESS2,
                                        chainId: CHAIN_ID,
                                        value: web3_1.default.utils.toWei('1', 'ether'),
                                        nonce: 65,
                                        gas: '10',
                                        gasPrice: '99',
                                        feeCurrency: '0x',
                                        gatewayFeeRecipient: '0x1234',
                                        gatewayFee: '0x5678',
                                        data: '0xabcdef',
                                    };
                                    return [4 /*yield*/, wallet.signTransaction(celoTransactionZeroPrefix)];
                                case 1:
                                    signedTx = _b.sent();
                                    expect(signedTx.tx.s.startsWith('0x00')).toBeFalsy();
                                    _a = signing_utils_1.recoverTransaction(signedTx.raw), recoveredSigner = _a[1];
                                    expect(address_1.normalizeAddressWith0x(recoveredSigner)).toBe(address_1.normalizeAddressWith0x(knownAddress));
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                });
                describe('when calling signPersonalMessage', function () {
                    test('succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var hexStr, signedMessage, valid;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    hexStr = ACCOUNT_ADDRESS1;
                                    return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, hexStr)];
                                case 1:
                                    signedMessage = _a.sent();
                                    expect(signedMessage).not.toBeUndefined();
                                    valid = signatureUtils_1.verifySignature(hexStr, signedMessage, knownAddress);
                                    expect(valid).toBeTruthy();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                });
                describe('when calling signTypedData', function () {
                    test('succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var signedMessage, valid;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, wallet.signTypedData(knownAddress, TYPED_DATA)];
                                case 1:
                                    signedMessage = _a.sent();
                                    expect(signedMessage).not.toBeUndefined();
                                    valid = signing_utils_1.verifyEIP712TypedDataSigner(TYPED_DATA, signedMessage, knownAddress);
                                    expect(valid).toBeTruthy();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                });
            });
        });
    });
});
//# sourceMappingURL=local-wallet.test.js.map