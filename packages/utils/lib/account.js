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
var bip32 = __importStar(require("bip32"));
var bip39 = __importStar(require("bip39"));
var randombytes_1 = __importDefault(require("randombytes"));
exports.CELO_DERIVATION_PATH_BASE = "m/44'/52752'/0'/0";
var MnemonicStrength;
(function (MnemonicStrength) {
    MnemonicStrength[MnemonicStrength["s128_12words"] = 128] = "s128_12words";
    MnemonicStrength[MnemonicStrength["s256_24words"] = 256] = "s256_24words";
})(MnemonicStrength = exports.MnemonicStrength || (exports.MnemonicStrength = {}));
var MnemonicLanguages;
(function (MnemonicLanguages) {
    MnemonicLanguages[MnemonicLanguages["chinese_simplified"] = 0] = "chinese_simplified";
    MnemonicLanguages[MnemonicLanguages["chinese_traditional"] = 1] = "chinese_traditional";
    MnemonicLanguages[MnemonicLanguages["english"] = 2] = "english";
    MnemonicLanguages[MnemonicLanguages["french"] = 3] = "french";
    MnemonicLanguages[MnemonicLanguages["italian"] = 4] = "italian";
    MnemonicLanguages[MnemonicLanguages["japanese"] = 5] = "japanese";
    MnemonicLanguages[MnemonicLanguages["korean"] = 6] = "korean";
    MnemonicLanguages[MnemonicLanguages["spanish"] = 7] = "spanish";
})(MnemonicLanguages = exports.MnemonicLanguages || (exports.MnemonicLanguages = {}));
function defaultGenerateMnemonic(strength, rng, wordlist) {
    return new Promise(function (resolve, reject) {
        strength = strength || 128;
        rng = rng || randombytes_1.default;
        rng(strength / 8, function (error, randomBytesBuffer) {
            if (error) {
                reject(error);
            }
            else {
                resolve(bip39.entropyToMnemonic(randomBytesBuffer.toString('hex'), wordlist));
            }
        });
    });
}
var bip39Wrapper = {
    mnemonicToSeedSync: bip39.mnemonicToSeedSync,
    mnemonicToSeed: bip39.mnemonicToSeed,
    generateMnemonic: defaultGenerateMnemonic,
    validateMnemonic: bip39.validateMnemonic,
};
function generateMnemonic(strength, language, bip39ToUse) {
    if (strength === void 0) { strength = MnemonicStrength.s256_24words; }
    if (bip39ToUse === void 0) { bip39ToUse = bip39Wrapper; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, bip39ToUse.generateMnemonic(strength, undefined, getWordList(language))];
        });
    });
}
exports.generateMnemonic = generateMnemonic;
function validateMnemonic(mnemonic, language, bip39ToUse) {
    if (bip39ToUse === void 0) { bip39ToUse = bip39Wrapper; }
    return bip39ToUse.validateMnemonic(mnemonic, getWordList(language));
}
exports.validateMnemonic = validateMnemonic;
function generateKeys(mnemonic, password, addressIndex, bip39ToUse, derivationPath) {
    if (addressIndex === void 0) { addressIndex = 0; }
    if (bip39ToUse === void 0) { bip39ToUse = bip39Wrapper; }
    if (derivationPath === void 0) { derivationPath = exports.CELO_DERIVATION_PATH_BASE; }
    return __awaiter(this, void 0, void 0, function () {
        var seed, node, newNode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bip39ToUse.mnemonicToSeed(mnemonic, password)];
                case 1:
                    seed = _a.sent();
                    node = bip32.fromSeed(seed);
                    newNode = node.derivePath(derivationPath + "/" + addressIndex);
                    if (!newNode.privateKey) {
                        // As we are generating the node from a seed, the node will always have a private key and this would never happened
                        throw new Error('utils-accounts@generateKeys: invalid node to derivate');
                    }
                    return [2 /*return*/, {
                            privateKey: newNode.privateKey.toString('hex'),
                            publicKey: newNode.publicKey.toString('hex'),
                        }];
            }
        });
    });
}
exports.generateKeys = generateKeys;
function generateKeysSync(mnemonic, password, addressIndex, bip39ToUse) {
    if (addressIndex === void 0) { addressIndex = 0; }
    if (bip39ToUse === void 0) { bip39ToUse = bip39Wrapper; }
    var seed = bip39ToUse.mnemonicToSeedSync(mnemonic, password);
    var node = bip32.fromSeed(seed);
    var newNode = node.derivePath(exports.CELO_DERIVATION_PATH_BASE + "/" + addressIndex);
    return {
        privateKey: newNode.privateKey.toString('hex'),
        publicKey: newNode.publicKey.toString('hex'),
    };
}
exports.generateKeysSync = generateKeysSync;
// Unify the bip39.wordlists (otherwise depends on the instance of the bip39)
function getWordList(language) {
    switch (language) {
        case MnemonicLanguages.chinese_simplified:
            return bip39.wordlists.chinese_simplified;
        case MnemonicLanguages.chinese_traditional:
            return bip39.wordlists.chinese_traditional;
        case MnemonicLanguages.english:
            return bip39.wordlists.english;
        case MnemonicLanguages.french:
            return bip39.wordlists.french;
        case MnemonicLanguages.italian:
            return bip39.wordlists.italian;
        case MnemonicLanguages.japanese:
            return bip39.wordlists.japanese;
        case MnemonicLanguages.korean:
            return bip39.wordlists.korean;
        case MnemonicLanguages.spanish:
            return bip39.wordlists.spanish;
        default:
            return bip39.wordlists.english;
    }
}
exports.AccountUtils = {
    generateMnemonic: generateMnemonic,
    validateMnemonic: validateMnemonic,
    generateKeys: generateKeys,
    generateKeysSync: generateKeysSync,
};
//# sourceMappingURL=account.js.map