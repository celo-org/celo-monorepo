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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var hw_transport_node_hid_1 = __importDefault(require("@ledgerhq/hw-transport-node-hid"));
// @ts-ignore-next-line
var eth_lib_1 = require("eth-lib");
var ethUtil = __importStar(require("ethereumjs-util"));
var web3_1 = __importDefault(require("web3"));
var signing_utils_1 = require("../utils/signing-utils");
var ledger_wallet_1 = require("./ledger-wallet");
// Update this variable when testing using a physical device
var USE_PHYSICAL_LEDGER = false;
// Increase timeout to give developer time to respond on device
var TEST_TIMEOUT_IN_MS = USE_PHYSICAL_LEDGER ? 30 * 1000 : 1 * 1000;
var PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
var ACCOUNT_ADDRESS1 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY1));
var PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc';
var ACCOUNT_ADDRESS2 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY2));
var PRIVATE_KEY3 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff1';
var ACCOUNT_ADDRESS3 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY3));
var PRIVATE_KEY4 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff2';
var ACCOUNT_ADDRESS4 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY4));
var PRIVATE_KEY5 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff3';
var ACCOUNT_ADDRESS5 = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY5));
var PRIVATE_KEY_NEVER = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ffffff';
var ACCOUNT_ADDRESS_NEVER = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(PRIVATE_KEY_NEVER));
var ledgerAddresses = {
    "44'/52752'/0'/0/0": {
        address: ACCOUNT_ADDRESS1,
        privateKey: PRIVATE_KEY1,
    },
    "44'/52752'/0'/0/1": {
        address: ACCOUNT_ADDRESS2,
        privateKey: PRIVATE_KEY2,
    },
    "44'/52752'/0'/0/2": {
        address: ACCOUNT_ADDRESS3,
        privateKey: PRIVATE_KEY3,
    },
    "44'/52752'/0'/0/3": {
        address: ACCOUNT_ADDRESS4,
        privateKey: PRIVATE_KEY4,
    },
    "44'/52752'/0'/0/4": {
        address: ACCOUNT_ADDRESS5,
        privateKey: PRIVATE_KEY5,
    },
};
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
function mockLedger(wallet, mockForceValidation) {
    var _this = this;
    jest.spyOn(wallet, 'generateNewLedger').mockImplementation(function (_transport) {
        return {
            getAddress: function (derivationPath, forceValidation) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (forceValidation) {
                        mockForceValidation();
                    }
                    if (ledgerAddresses[derivationPath]) {
                        return [2 /*return*/, { address: ledgerAddresses[derivationPath].address, derivationPath: derivationPath }];
                    }
                    return [2 /*return*/, {}];
                });
            }); },
            signTransaction: function (derivationPath, data) { return __awaiter(_this, void 0, void 0, function () {
                var hash, signature, _a, v, r, s;
                return __generator(this, function (_b) {
                    if (ledgerAddresses[derivationPath]) {
                        hash = signing_utils_1.getHashFromEncoded(address_1.ensureLeading0x(data));
                        signature = eth_lib_1.account.makeSigner(signing_utils_1.chainIdTransformationForSigning(CHAIN_ID))(hash, ledgerAddresses[derivationPath].privateKey);
                        _a = eth_lib_1.account.decodeSignature(signature), v = _a[0], r = _a[1], s = _a[2];
                        return [2 /*return*/, { v: v, r: r, s: s }];
                    }
                    throw new Error('Invalid Path');
                });
            }); },
            signPersonalMessage: function (derivationPath, data) { return __awaiter(_this, void 0, void 0, function () {
                var dataBuff, msgHashBuff, trimmedKey, pkBuffer, signature;
                return __generator(this, function (_a) {
                    if (ledgerAddresses[derivationPath]) {
                        dataBuff = ethUtil.toBuffer(address_1.ensureLeading0x(data));
                        msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
                        trimmedKey = address_1.trimLeading0x(ledgerAddresses[derivationPath].privateKey);
                        pkBuffer = Buffer.from(trimmedKey, 'hex');
                        signature = ethUtil.ecsign(msgHashBuff, pkBuffer);
                        return [2 /*return*/, {
                                v: signature.v,
                                r: signature.r.toString('hex'),
                                s: signature.s.toString('hex'),
                            }];
                    }
                    throw new Error('Invalid Path');
                });
            }); },
            getAppConfiguration: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, { arbitraryDataEnabled: 1, version: '0.0.0' }];
                });
            }); },
        };
    });
}
describe('LedgerWallet class', function () {
    var wallet;
    var hardwareWallet;
    var knownAddress = ACCOUNT_ADDRESS1;
    var otherAddress = ACCOUNT_ADDRESS2;
    var unknownAddress = ACCOUNT_ADDRESS_NEVER;
    var mockForceValidation;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var transport, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.setTimeout(TEST_TIMEOUT_IN_MS);
                    if (!USE_PHYSICAL_LEDGER) return [3 /*break*/, 6];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    if (!!hardwareWallet) return [3 /*break*/, 4];
                    return [4 /*yield*/, hw_transport_node_hid_1.default.open('')];
                case 2:
                    transport = _a.sent();
                    return [4 /*yield*/, new ledger_wallet_1.LedgerWallet(undefined, undefined, transport)];
                case 3:
                    hardwareWallet = _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    throw new Error('Failed to connect to ledger. Ensure the Celo app is open and not already connected with a separate client');
                case 6:
                    wallet = new ledger_wallet_1.LedgerWallet();
                    mockForceValidation = jest.fn(function () {
                        // do nothing
                    });
                    mockLedger(wallet, mockForceValidation);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('without initializing', function () {
        var celoTransaction;
        beforeAll(function () {
            celoTransaction = {
                from: knownAddress,
                to: knownAddress,
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
                    case 0:
                        if (USE_PHYSICAL_LEDGER) {
                            wallet = hardwareWallet;
                        }
                        return [4 /*yield*/, wallet.init()];
                    case 1:
                        _a.sent();
                        if (USE_PHYSICAL_LEDGER) {
                            knownAddress = wallet.getAccounts()[0];
                            otherAddress = wallet.getAccounts()[1];
                        }
                        return [2 /*return*/];
                }
            });
        }); }, TEST_TIMEOUT_IN_MS);
        test('starts 5 accounts', function () {
            expect(wallet.getAccounts().length).toBe(5);
        });
        test('returns true if it has the accounts', function () {
            expect(wallet.hasAccount(knownAddress)).toBeTruthy();
        });
        test('returns false if it has the accounts', function () {
            expect(wallet.hasAccount(ACCOUNT_ADDRESS_NEVER)).toBeFalsy();
        });
        describe('with an account', function () {
            var celoTransaction;
            beforeEach(function () {
                celoTransaction = {
                    from: unknownAddress,
                    to: unknownAddress,
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
            describe('signing', function () {
                describe('using an unknown address', function () {
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
                    }); }, TEST_TIMEOUT_IN_MS);
                    test('fails calling signTypedData', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, expect(wallet.signTypedData(unknownAddress, TYPED_DATA)).rejects.toThrowError()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, TEST_TIMEOUT_IN_MS);
                });
                describe('using a known address', function () {
                    describe('when calling signTransaction', function () {
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
                        }); }, TEST_TIMEOUT_IN_MS);
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
                        }); }, TEST_TIMEOUT_IN_MS);
                        // https://github.com/ethereum/go-ethereum/blob/38aab0aa831594f31d02c9f02bfacc0bef48405d/rlp/decode.go#L664
                        test('signature with 0x00 prefix is canonicalized', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var celoTransactionZeroPrefix, signedTx, _a, recoveredSigner;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        celoTransactionZeroPrefix = {
                                            from: knownAddress,
                                            to: otherAddress,
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
                        }); }, TEST_TIMEOUT_IN_MS);
                    });
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
                    }); }, TEST_TIMEOUT_IN_MS);
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
                    }); }, TEST_TIMEOUT_IN_MS);
                });
            });
        });
    });
    /**
     * These tests are entirely mocked for now
     */
    describe('asking for addresses validations', function () {
        beforeEach(function () {
            knownAddress = ACCOUNT_ADDRESS1;
            otherAddress = ACCOUNT_ADDRESS2;
        });
        describe('never', function () {
            beforeEach(function () {
                wallet = new ledger_wallet_1.LedgerWallet(undefined, undefined, {}, ledger_wallet_1.AddressValidation.never);
                mockForceValidation = jest.fn(function () {
                    // do nothing
                });
                mockLedger(wallet, mockForceValidation);
            });
            it("won't validate", function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, wallet.init()];
                        case 1:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(0);
                            return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 2:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(0);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('only in the initialization', function () {
            beforeEach(function () {
                wallet = new ledger_wallet_1.LedgerWallet(undefined, undefined, {}, ledger_wallet_1.AddressValidation.initializationOnly);
                mockForceValidation = jest.fn(function () {
                    // do nothing
                });
                mockLedger(wallet, mockForceValidation);
            });
            it('will validate the addresses only in the initialization', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, wallet.init()];
                        case 1:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(5);
                            return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 2:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(5);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('every transaction', function () {
            beforeEach(function () {
                wallet = new ledger_wallet_1.LedgerWallet(undefined, undefined, {}, ledger_wallet_1.AddressValidation.everyTransaction);
                mockForceValidation = jest.fn(function () {
                    // do nothing
                });
                mockLedger(wallet, mockForceValidation);
            });
            it('will validate every transaction', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, wallet.init()];
                        case 1:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(0);
                            return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 2:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(1);
                            return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 3:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(2);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('once per address', function () {
            beforeEach(function () {
                wallet = new ledger_wallet_1.LedgerWallet(undefined, undefined, {}, ledger_wallet_1.AddressValidation.firstTransactionPerAddress);
                mockForceValidation = jest.fn(function () {
                    // do nothing
                });
                mockLedger(wallet, mockForceValidation);
            });
            it('will validate only in the first transaction of the address', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, wallet.init()];
                        case 1:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(0);
                            return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 2:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(1);
                            return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 3:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(1);
                            return [4 /*yield*/, wallet.signPersonalMessage(otherAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 4:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(2);
                            return [4 /*yield*/, wallet.signPersonalMessage(otherAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 5:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(2);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('by default (acts as firstTransactionPerAddress)', function () {
            beforeEach(function () {
                wallet = new ledger_wallet_1.LedgerWallet();
                mockForceValidation = jest.fn(function () {
                    // do nothing
                });
                mockLedger(wallet, mockForceValidation);
            });
            it('will validate only in the first transaction of the address', function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, wallet.init()];
                        case 1:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(0);
                            return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 2:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(1);
                            return [4 /*yield*/, wallet.signPersonalMessage(knownAddress, ACCOUNT_ADDRESS_NEVER)];
                        case 3:
                            _a.sent();
                            expect(mockForceValidation.mock.calls.length).toBe(1);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=ledger-wallet.test.js.map