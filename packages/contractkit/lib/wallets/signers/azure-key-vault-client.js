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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
var identity_1 = require("@azure/identity");
var keyvault_keys_1 = require("@azure/keyvault-keys");
var address_1 = require("@celo/utils/lib/address");
var bignumber_js_1 = require("bignumber.js");
var debug_1 = __importDefault(require("debug"));
var elliptic_1 = require("elliptic");
var ethUtil = __importStar(require("ethereumjs-util"));
var secp256k1_1 = require("secp256k1");
var debug = debug_1.default('kit:wallet:akv-client');
/**
 * Provides an abstraction on Azure Key Vault for performing signing operations
 */
var AzureKeyVaultClient = /** @class */ (function () {
    function AzureKeyVaultClient(vaultName) {
        this.SIGNING_ALGORITHM = 'ECDSA256';
        // 0x04 prefix indicates that the key is not compressed
        // https://tools.ietf.org/html/rfc5480#section-2.2
        this.publicKeyPrefix = 0x04;
        this.secp256k1Curve = new elliptic_1.ec('secp256k1');
        this.cryptographyClientSet = new Map();
        this.vaultName = vaultName;
        this.vaultUri = "https://" + this.vaultName + ".vault.azure.net";
        // DefaultAzureCredential supports service principal or managed identity
        // If using a service principal, you must set the appropriate environment vars
        this.credential = new identity_1.DefaultAzureCredential();
        this.keyClient = new keyvault_keys_1.KeyClient(this.vaultUri, this.credential);
    }
    AzureKeyVaultClient.prototype.getKeys = function () {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function () {
            var keyNames, _b, _c, keyProperties, e_1_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        keyNames = new Array();
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 12]);
                        _b = __asyncValues(this.keyClient.listPropertiesOfKeys());
                        _d.label = 2;
                    case 2: return [4 /*yield*/, _b.next()];
                    case 3:
                        if (!(_c = _d.sent(), !_c.done)) return [3 /*break*/, 5];
                        keyProperties = _c.value;
                        keyNames.push(keyProperties.name);
                        _d.label = 4;
                    case 4: return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 12];
                    case 6:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 12];
                    case 7:
                        _d.trys.push([7, , 10, 11]);
                        if (!(_c && !_c.done && (_a = _b.return))) return [3 /*break*/, 9];
                        return [4 /*yield*/, _a.call(_b)];
                    case 8:
                        _d.sent();
                        _d.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 11: return [7 /*endfinally*/];
                    case 12: return [2 /*return*/, keyNames];
                }
            });
        });
    };
    AzureKeyVaultClient.prototype.getPublicKey = function (keyName) {
        return __awaiter(this, void 0, void 0, function () {
            var signingKey, pubKeyPrefix, rawPublicKey, publicKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getKey(keyName)];
                    case 1:
                        signingKey = _a.sent();
                        pubKeyPrefix = Buffer.from(new Uint8Array([this.publicKeyPrefix]));
                        rawPublicKey = Buffer.concat([
                            pubKeyPrefix,
                            Buffer.from(signingKey.key.x),
                            Buffer.from(signingKey.key.y),
                        ]);
                        publicKey = AzureKeyVaultClient.bufferToBigNumber(rawPublicKey);
                        return [2 /*return*/, publicKey];
                }
            });
        });
    };
    AzureKeyVaultClient.prototype.getKeyId = function (keyName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.hasKey(keyName)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new Error("Unable to locate key: " + keyName);
                        }
                        return [4 /*yield*/, this.getKey(keyName)];
                    case 2: return [2 /*return*/, (_a.sent()).id];
                }
            });
        });
    };
    AzureKeyVaultClient.prototype.signMessage = function (message, keyName) {
        return __awaiter(this, void 0, void 0, function () {
            var cryptographyClient, signResult, rawSignature, R, S, N, rBuff, sBuff, canonicalizedSignature, publicKey, recoveryParam;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.hasKey(keyName)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new Error("Unable to locate key: " + keyName);
                        }
                        return [4 /*yield*/, this.getCryptographyClient(keyName)
                            // @ts-ignore-next-line (ECDSA256 is not included in the client enum but is valid)
                        ];
                    case 2:
                        cryptographyClient = _a.sent();
                        return [4 /*yield*/, cryptographyClient.sign(this.SIGNING_ALGORITHM, message)
                            // The output of this will be a 64 byte array.
                            // The first 32 are the value for R and the rest is S
                        ];
                    case 3:
                        signResult = _a.sent();
                        // The output of this will be a 64 byte array.
                        // The first 32 are the value for R and the rest is S
                        if (typeof signResult === 'undefined' ||
                            typeof signResult.result === 'undefined' ||
                            signResult.result.length !== 64) {
                            throw new Error("Invalid signature returned from Azure: " + signResult);
                        }
                        rawSignature = signResult.result;
                        R = AzureKeyVaultClient.bufferToBigNumber(Buffer.from(rawSignature.slice(0, 32)));
                        S = AzureKeyVaultClient.bufferToBigNumber(Buffer.from(rawSignature.slice(32, 64)));
                        N = AzureKeyVaultClient.bufferToBigNumber(this.secp256k1Curve.curve.n);
                        if (!AzureKeyVaultClient.isCanonical(S, N)) {
                            debug('Canonicalizing signature');
                            S = N.minus(S);
                        }
                        rBuff = AzureKeyVaultClient.bigNumberToBuffer(R);
                        sBuff = AzureKeyVaultClient.bigNumberToBuffer(S);
                        canonicalizedSignature = Buffer.concat([rBuff, sBuff]);
                        return [4 /*yield*/, this.getPublicKey(keyName)
                            // Azure doesn't provide the recovery key in the signature
                        ];
                    case 4:
                        publicKey = _a.sent();
                        recoveryParam = AzureKeyVaultClient.recoverKeyIndex(canonicalizedSignature, publicKey, message);
                        return [2 /*return*/, new Signature(recoveryParam, rBuff, sBuff)];
                }
            });
        });
    };
    AzureKeyVaultClient.prototype.hasKey = function (keyName) {
        return __awaiter(this, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.keyClient.getKey(keyName)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        if (e_2.message.includes('this is not a valid private key')) {
                            return [2 /*return*/, false];
                        }
                        throw e_2;
                    case 3: return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Returns true if the signature is in the "bottom" of the curve
     */
    AzureKeyVaultClient.isCanonical = function (S, curveN) {
        return S.comparedTo(curveN.dividedBy(2)) <= 0;
    };
    /**
     * Attempts each recovery key to find a match
     */
    AzureKeyVaultClient.recoverKeyIndex = function (signature, publicKey, hash) {
        for (var i = 0; i < 4; i++) {
            var compressed = false;
            try {
                var recoveredPublicKeyByteArr = secp256k1_1.ecdsaRecover(signature, i, hash, compressed);
                var publicKeyBuff = Buffer.from(recoveredPublicKeyByteArr);
                var recoveredPublicKey = AzureKeyVaultClient.bufferToBigNumber(publicKeyBuff);
                debug('Recovered key: ' + recoveredPublicKey);
                if (publicKey.eq(recoveredPublicKey)) {
                    return i;
                }
            }
            catch (e) {
                if (e.message === 'Public key could not be recover') {
                    throw new Error('Invalid public key. Ensure that the key type is ECDSA');
                }
            }
        }
        throw new Error('Unable to generate recovery key from signature.');
    };
    AzureKeyVaultClient.prototype.getKey = function (keyName) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function () {
            var signingKey, e_3;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.keyClient.getKey(keyName)];
                    case 1:
                        signingKey = _f.sent();
                        if (typeof ((_a = signingKey) === null || _a === void 0 ? void 0 : _a.id) === 'undefined' ||
                            typeof ((_c = (_b = signingKey) === null || _b === void 0 ? void 0 : _b.key) === null || _c === void 0 ? void 0 : _c.x) === 'undefined' ||
                            typeof ((_e = (_d = signingKey) === null || _d === void 0 ? void 0 : _d.key) === null || _e === void 0 ? void 0 : _e.y) === 'undefined') {
                            throw new Error("Invalid key data returned from Azure: " + signingKey);
                        }
                        return [2 /*return*/, signingKey];
                    case 2:
                        e_3 = _f.sent();
                        if (e_3.message.includes('Key not found')) {
                            throw new Error("Key " + keyName + " not found in KeyVault " + this.vaultName);
                        }
                        throw new Error("Unexpected KeyVault error " + e_3.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AzureKeyVaultClient.bufferToBigNumber = function (input) {
        return new bignumber_js_1.BigNumber(address_1.ensureLeading0x(input.toString('hex')));
    };
    AzureKeyVaultClient.bigNumberToBuffer = function (input) {
        return ethUtil.toBuffer(address_1.ensureLeading0x(input.toString(16)));
    };
    /**
     * Provides the CryptographyClient for the requested key
     * Creates a new client if it doesn't already exist
     */
    AzureKeyVaultClient.prototype.getCryptographyClient = function (keyName) {
        return __awaiter(this, void 0, void 0, function () {
            var keyId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.cryptographyClientSet.has(keyName)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getKeyId(keyName)];
                    case 1:
                        keyId = _a.sent();
                        this.cryptographyClientSet.set(keyName, new keyvault_keys_1.CryptographyClient(keyId, this.credential));
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.cryptographyClientSet.get(keyName)];
                }
            });
        });
    };
    return AzureKeyVaultClient;
}());
exports.AzureKeyVaultClient = AzureKeyVaultClient;
var Signature = /** @class */ (function () {
    function Signature(v, r, s) {
        this.v = v;
        this.r = r;
        this.s = s;
    }
    return Signature;
}());
exports.Signature = Signature;
//# sourceMappingURL=azure-key-vault-client.js.map