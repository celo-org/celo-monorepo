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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var ecdh_1 = require("@celo/utils/lib/ecdh");
var ecies_1 = require("@celo/utils/lib/ecies");
var signatureUtils_1 = require("@celo/utils/src/signatureUtils");
var wallet_base_1 = require("@celo/wallet-base");
var web3_1 = __importDefault(require("web3"));
var _1 = require(".");
var in_memory_wallet_1 = require("./test/in-memory-wallet");
var mock_client_1 = require("./test/mock-client");
var CHAIN_ID = 44378;
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
var testTx = {
    from: in_memory_wallet_1.testAddress,
    to: (0, address_1.privateKeyToAddress)('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef'),
    chainId: CHAIN_ID,
    value: web3_1.default.utils.toWei('1', 'ether'),
    nonce: 0,
    gas: '10',
    gasPrice: '99',
    feeCurrency: '0x',
    gatewayFeeRecipient: '0x',
    gatewayFee: '0x',
    data: '0xabcdef',
};
var decryptMessage = 'Hello';
var walletConnectBridge = process.env.WALLET_CONNECT_BRIDGE;
var E2E = !!walletConnectBridge;
describe('WalletConnectWallet tests', function () {
    var wallet;
    var testWallet;
    wallet = new _1.WalletConnectWallet({
        init: {
            relayProvider: walletConnectBridge,
            logger: 'error',
        },
        connect: {
            metadata: {
                name: 'Example Dapp',
                description: 'Example Dapp for WalletConnect',
                url: 'https://example.org/',
                icons: [],
            },
        },
    });
    if (E2E) {
        testWallet = (0, in_memory_wallet_1.getTestWallet)();
    }
    else {
        jest
            .spyOn(wallet, 'getWalletConnectClient')
            .mockImplementation(function () { return new mock_client_1.MockWalletConnectClient(); });
    }
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var uri;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wallet.getUri()];
                case 1:
                    uri = _a.sent();
                    return [4 /*yield*/, (testWallet === null || testWallet === void 0 ? void 0 : testWallet.init(uri))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, wallet.init()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wallet.close()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (testWallet === null || testWallet === void 0 ? void 0 : testWallet.close())
                        // TODO: bug in WalletConnect V2
                    ];
                case 2:
                    _a.sent();
                    // TODO: bug in WalletConnect V2
                    setTimeout(function () {
                        process.exit(0);
                    }, 10000);
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    it('getAccounts()', function () { return __awaiter(void 0, void 0, void 0, function () {
        var accounts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wallet.getAccounts()];
                case 1:
                    accounts = _a.sent();
                    expect(accounts.length).toBe(1);
                    expect((0, address_1.eqAddress)(accounts[0], in_memory_wallet_1.testAddress)).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('operations with an unknown address', function () {
        var unknownAddress = (0, address_1.privateKeyToAddress)('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef');
        function assertInvalidAddress(e) {
            // dealing with checksum addresses
            expect(e.message.toLowerCase()).toBe(("Could not find address " + unknownAddress).toLowerCase());
        }
        it('hasAccount()', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                expect(wallet.hasAccount(unknownAddress)).toBeFalsy();
                return [2 /*return*/];
            });
        }); });
        it('signPersonalMessage()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var hexString, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hexString = (0, address_1.ensureLeading0x)(Buffer.from('hello').toString('hex'));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, wallet.signPersonalMessage(unknownAddress, hexString)];
                    case 2:
                        _a.sent();
                        throw new Error('Expected exception to be thrown');
                    case 3:
                        e_1 = _a.sent();
                        assertInvalidAddress(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        it('signTypedData()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, wallet.signTypedData(unknownAddress, TYPED_DATA)];
                    case 1:
                        _a.sent();
                        throw new Error('Expected exception to be thrown');
                    case 2:
                        e_2 = _a.sent();
                        assertInvalidAddress(e_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        it('signTransaction()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, wallet.signTransaction(__assign(__assign({}, testTx), { from: unknownAddress }))];
                    case 1:
                        _a.sent();
                        throw new Error('Expected exception to be thrown');
                    case 2:
                        e_3 = _a.sent();
                        assertInvalidAddress(e_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        it('decrypt()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var encrypted, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        encrypted = ecies_1.ECIES.Encrypt(Buffer.from((0, address_1.trimLeading0x)((0, address_1.privateKeyToPublicKey)(in_memory_wallet_1.testPrivateKey)), 'hex'), Buffer.from(decryptMessage));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, wallet.decrypt(unknownAddress, encrypted)];
                    case 2:
                        _a.sent();
                        throw new Error('Expected exception to be thrown');
                    case 3:
                        e_4 = _a.sent();
                        assertInvalidAddress(e_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        it('computeSharedSecret()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var otherPubKey, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        otherPubKey = (0, address_1.privateKeyToPublicKey)('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, wallet.computeSharedSecret(unknownAddress, otherPubKey)];
                    case 2:
                        _a.sent();
                        throw new Error('Expected exception to be thrown');
                    case 3:
                        e_5 = _a.sent();
                        assertInvalidAddress(e_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
    describe('with a known address', function () {
        it('hasAccount()', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                expect(wallet.hasAccount(in_memory_wallet_1.testAddress)).toBeTruthy();
                return [2 /*return*/];
            });
        }); });
        it('signPersonalMessage()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var hexString, signedMessage, valid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hexString = (0, address_1.ensureLeading0x)(Buffer.from('hello').toString('hex'));
                        return [4 /*yield*/, wallet.signPersonalMessage(in_memory_wallet_1.testAddress, hexString)];
                    case 1:
                        signedMessage = _a.sent();
                        expect(signedMessage).not.toBeUndefined();
                        valid = (0, signatureUtils_1.verifySignature)(hexString, signedMessage, in_memory_wallet_1.testAddress);
                        expect(valid).toBeTruthy();
                        return [2 /*return*/];
                }
            });
        }); });
        it('signTypedData()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var signedMessage, valid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, wallet.signTypedData(in_memory_wallet_1.testAddress, TYPED_DATA)];
                    case 1:
                        signedMessage = _a.sent();
                        expect(signedMessage).not.toBeUndefined();
                        valid = (0, signatureUtils_1.verifyEIP712TypedDataSigner)(TYPED_DATA, signedMessage, in_memory_wallet_1.testAddress);
                        expect(valid).toBeTruthy();
                        return [2 /*return*/];
                }
            });
        }); });
        it('signTransaction()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var signedTx, _a, recoveredSigner;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, wallet.signTransaction(testTx)];
                    case 1:
                        signedTx = _b.sent();
                        _a = __read((0, wallet_base_1.recoverTransaction)(signedTx.raw), 2), recoveredSigner = _a[1];
                        expect((0, address_1.eqAddress)(recoveredSigner, in_memory_wallet_1.testAddress)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        it('decrypt()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var encrypted, decrypted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        encrypted = ecies_1.ECIES.Encrypt(Buffer.from((0, address_1.trimLeading0x)((0, address_1.privateKeyToPublicKey)(in_memory_wallet_1.testPrivateKey)), 'hex'), Buffer.from(decryptMessage));
                        return [4 /*yield*/, wallet.decrypt(in_memory_wallet_1.testAddress, encrypted)];
                    case 1:
                        decrypted = _a.sent();
                        expect(decrypted.toString()).toBe(decryptMessage);
                        return [2 /*return*/];
                }
            });
        }); });
        it('computeSharedSecret()', function () { return __awaiter(void 0, void 0, void 0, function () {
            var otherPubKey, sharedSecret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        otherPubKey = (0, address_1.privateKeyToPublicKey)('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abbdef');
                        return [4 /*yield*/, wallet.computeSharedSecret(in_memory_wallet_1.testAddress, otherPubKey)];
                    case 1:
                        sharedSecret = _a.sent();
                        expect(sharedSecret).toEqual((0, ecdh_1.computeSharedSecret)(in_memory_wallet_1.testPrivateKey, otherPubKey));
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=wc-signer.test.js.map