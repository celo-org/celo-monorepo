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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var bignumber_js_1 = require("bignumber.js");
var ethUtil = __importStar(require("ethereumjs-util"));
var web3_1 = __importDefault(require("web3"));
var azure_key_vault_client_1 = require("../utils/azure-key-vault-client");
var signing_utils_1 = require("../utils/signing-utils");
var azure_hsm_wallet_1 = require("./azure-hsm-wallet");
// Env var should hold service principal credentials
// https://www.npmjs.com/package/@azure/keyvault-keys
require('dotenv').config();
var USING_MOCK = typeof process.env.AZURE_KEY_NAME === 'undefined' ||
    process.env.AZURE_KEY_NAME === '<AZURE_KEY_NAME>';
var AZURE_KEY_NAME = USING_MOCK ? 'secp' : process.env.AZURE_KEY_NAME;
var AZURE_VAULT_NAME = USING_MOCK ? 'mockVault' : process.env.AZURE_VAULT_NAME;
var PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
var ACCOUNT_ADDRESS1 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY1));
var PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc';
var ACCOUNT_ADDRESS2 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY2));
var PRIVATE_KEY_NEVER = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ffffff';
var ACCOUNT_ADDRESS_NEVER = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY_NEVER));
var CHAIN_ID = 44378;
var keyVaultAddresses = new Map([
    [
        'secp',
        {
            address: ACCOUNT_ADDRESS1,
            privateKey: PRIVATE_KEY1,
        },
    ],
    [
        'secp2',
        {
            address: ACCOUNT_ADDRESS2,
            privateKey: PRIVATE_KEY2,
        },
    ],
]);
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
describe('AzureHSMWallet class', function () {
    var wallet;
    // validate env file
    beforeEach(function () {
        // Use mock client if env vars not specified
        if (!USING_MOCK) {
            // Ensure all env vars are specified
            expect(process.env.AZURE_CLIENT_ID).toBeDefined();
            expect(process.env.AZURE_CLIENT_SECRET).toBeDefined();
            expect(process.env.AZURE_TENANT_ID).toBeDefined();
            expect(process.env.AZURE_VAULT_NAME).toBeDefined();
            expect(process.env.AZURE_KEY_NAME).toBeDefined();
        }
        wallet = new azure_hsm_wallet_1.AzureHSMWallet(AZURE_VAULT_NAME);
        if (USING_MOCK) {
            jest
                .spyOn(wallet, 'generateNewKeyVaultClient')
                .mockImplementation(function (_transport) {
                return {
                    getKeys: function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, Array.from(keyVaultAddresses.keys())];
                        });
                    }); },
                    getPublicKey: function (keyName) { return __awaiter(void 0, void 0, void 0, function () {
                        var privKey, pubKey;
                        return __generator(this, function (_a) {
                            if (!keyVaultAddresses.has(keyName)) {
                                throw new Error("Key " + keyName + " not found in KeyVault " + AZURE_VAULT_NAME);
                            }
                            privKey = keyVaultAddresses.get(keyName).privateKey;
                            pubKey = ethUtil.privateToPublic(ethUtil.toBuffer(privKey));
                            return [2 /*return*/, new bignumber_js_1.BigNumber(address_1.ensureLeading0x(pubKey.toString('hex')))];
                        });
                    }); },
                    signMessage: function (message, keyName) { return __awaiter(void 0, void 0, void 0, function () {
                        var trimmedKey, pkBuffer, signature;
                        return __generator(this, function (_a) {
                            if (keyVaultAddresses.has(keyName)) {
                                trimmedKey = address_1.trimLeading0x(keyVaultAddresses.get(keyName).privateKey);
                                pkBuffer = Buffer.from(trimmedKey, 'hex');
                                signature = ethUtil.ecsign(message, pkBuffer);
                                // Azure HSM doesn't add the byte prefix (+27) while ecsign does
                                // Subtract 27 to properly mock the HSM signer
                                return [2 /*return*/, new azure_key_vault_client_1.Signature(signature.v - 27, signature.r, signature.s)];
                            }
                            throw new Error("Unable to locate key: " + keyName);
                        });
                    }); },
                };
            });
        }
    });
    describe('without initializing', function () {
        var knownAddress = ACCOUNT_ADDRESS1;
        var celoTransaction;
        beforeEach(function () {
            celoTransaction = {
                from: knownAddress,
                to: knownAddress,
                chainId: CHAIN_ID,
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
        test('fails calling getAccounts', function () {
            try {
                wallet.getAccounts();
                throw new Error('Expected exception to be thrown');
            }
            catch (e) {
                expect(e.message).toBe('wallet needs to be initialized first');
            }
        });
        test('fails calling hasAccount', function () {
            try {
                wallet.hasAccount(ACCOUNT_ADDRESS1);
                throw new Error('Expected exception to be thrown');
            }
            catch (e) {
                expect(e.message).toBe('wallet needs to be initialized first');
            }
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
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(wallet.signPersonalMessage(ACCOUNT_ADDRESS1, 'test')).rejects.toThrowError()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        test('fails calling signTypedData', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(wallet.signTypedData(ACCOUNT_ADDRESS1, TYPED_DATA)).rejects.toThrowError()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('after initializing', function () {
        beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, wallet.init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        test('hasAccount should return false for keys that are not present', function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Invalid key should not be present
                        _a = expect;
                        return [4 /*yield*/, wallet.hasAccount('this is not a valid private key')];
                    case 1:
                        // Invalid key should not be present
                        _a.apply(void 0, [_b.sent()]).toBeFalsy();
                        return [2 /*return*/];
                }
            });
        }); });
        test('hasAccount should return true for keys that are present', function () { return __awaiter(void 0, void 0, void 0, function () {
            var address, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, wallet.getAddressFromKeyName(AZURE_KEY_NAME)];
                    case 1:
                        address = _b.sent();
                        _a = expect;
                        return [4 /*yield*/, wallet.hasAccount(address)];
                    case 2:
                        _a.apply(void 0, [_b.sent()]).toBeTruthy();
                        return [2 /*return*/];
                }
            });
        }); });
        describe('with an account', function () {
            describe('signing', function () {
                describe('using an unknown key', function () {
                    var celoTransaction;
                    var unknownKey = 'invalidKey';
                    var unknownAddress = ACCOUNT_ADDRESS_NEVER;
                    beforeEach(function () {
                        celoTransaction = {
                            from: unknownAddress,
                            chainId: CHAIN_ID,
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
                    test('fails getting address from key', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, wallet.getAddressFromKeyName(unknownKey)];
                                case 1:
                                    _a.sent();
                                    throw new Error('Expected exception to be thrown');
                                case 2:
                                    e_1 = _a.sent();
                                    expect(e_1.message).toBe("Key " + unknownKey + " not found in KeyVault " + AZURE_VAULT_NAME);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    test('fails calling signTransaction', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var e_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, wallet.signTransaction(celoTransaction)];
                                case 1:
                                    _a.sent();
                                    throw new Error('Expected exception to be thrown');
                                case 2:
                                    e_2 = _a.sent();
                                    expect(e_2.message).toBe("Could not find address " + unknownAddress);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    test('fails calling signPersonalMessage', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var hexStr, e_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    hexStr = '0xa1';
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, wallet.signPersonalMessage(unknownAddress, hexStr)];
                                case 2:
                                    _a.sent();
                                    throw new Error('Expected exception to be thrown');
                                case 3:
                                    e_3 = _a.sent();
                                    expect(e_3.message).toBe("Could not find address " + unknownAddress);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    test('fails calling signTypedData', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var e_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, wallet.signTypedData(unknownAddress, TYPED_DATA)];
                                case 1:
                                    _a.sent();
                                    throw new Error('Expected exception to be thrown');
                                case 2:
                                    e_4 = _a.sent();
                                    expect(e_4.message).toBe("Could not find address " + unknownAddress);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                });
                describe('using a known key', function () {
                    var celoTransaction;
                    var knownKey = AZURE_KEY_NAME;
                    var knownAddress;
                    var otherAddress = ACCOUNT_ADDRESS2;
                    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, wallet.getAddressFromKeyName(knownKey)];
                                case 1:
                                    knownAddress = _a.sent();
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
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    describe('when calling signTransaction', function () {
                        test('succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var signedTx;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, wallet.signTransaction(celoTransaction)];
                                    case 1:
                                        signedTx = _a.sent();
                                        expect(signedTx).not.toBeUndefined();
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
                            var celoTransactionZeroPrefix, _a, signedTx, _b, recoveredSigner;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _a = {};
                                        return [4 /*yield*/, wallet.getAddressFromKeyName(knownKey)];
                                    case 1:
                                        celoTransactionZeroPrefix = (_a.from = _c.sent(),
                                            _a.to = ACCOUNT_ADDRESS2,
                                            _a.chainId = CHAIN_ID,
                                            _a.value = web3_1.default.utils.toWei('1', 'ether'),
                                            _a.nonce = 65,
                                            _a.gas = '10',
                                            _a.gasPrice = '99',
                                            _a.feeCurrency = '0x',
                                            _a.gatewayFeeRecipient = '0x1234',
                                            _a.gatewayFee = '0x5678',
                                            _a.data = '0xabcdef',
                                            _a);
                                        return [4 /*yield*/, wallet.signTransaction(celoTransactionZeroPrefix)];
                                    case 2:
                                        signedTx = _c.sent();
                                        expect(signedTx.tx.s.startsWith('0x00')).toBeFalsy();
                                        _b = signing_utils_1.recoverTransaction(signedTx.raw), recoveredSigner = _b[1];
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
});
//# sourceMappingURL=azure-hsm-wallet.test.js.map