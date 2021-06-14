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
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var ethUtil = __importStar(require("ethereumjs-util"));
var azure_key_vault_client_1 = require("../utils/azure-key-vault-client");
var remote_wallet_1 = require("./remote-wallet");
var azure_hsm_signer_1 = require("./signers/azure-hsm-signer");
// Azure Key Vault implementation of a RemoteWallet
var AzureHSMWallet = /** @class */ (function (_super) {
    __extends(AzureHSMWallet, _super);
    function AzureHSMWallet(vaultName) {
        var _this = _super.call(this) || this;
        _this.vaultName = vaultName;
        return _this;
    }
    AzureHSMWallet.prototype.loadAccountSigners = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keys, addressToSigner, _i, keys_1, key, address, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.keyVaultClient) {
                            this.keyVaultClient = this.generateNewKeyVaultClient(this.vaultName);
                        }
                        return [4 /*yield*/, this.keyVaultClient.getKeys()];
                    case 1:
                        keys = _a.sent();
                        addressToSigner = new Map();
                        _i = 0, keys_1 = keys;
                        _a.label = 2;
                    case 2:
                        if (!(_i < keys_1.length)) return [3 /*break*/, 7];
                        key = keys_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.getAddressFromKeyName(key)];
                    case 4:
                        address = _a.sent();
                        addressToSigner.set(address, new azure_hsm_signer_1.AzureHSMSigner(this.keyVaultClient, key));
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        // Safely ignore non-secp256k1 keys
                        if (!e_1.message.includes('Invalid secp256k1')) {
                            throw e_1;
                        }
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, addressToSigner];
                }
            });
        });
    };
    // Extracted for testing purpose
    AzureHSMWallet.prototype.generateNewKeyVaultClient = function (vaultName) {
        return new azure_key_vault_client_1.AzureKeyVaultClient(vaultName);
    };
    /**
     * Returns the EVM address for the given key
     * Useful for initially getting the 'from' field given a keyName
     * @param keyName Azure KeyVault key name
     */
    AzureHSMWallet.prototype.getAddressFromKeyName = function (keyName) {
        return __awaiter(this, void 0, void 0, function () {
            var publicKey, pkBuffer, address;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.keyVaultClient) {
                            throw new Error('AzureHSMWallet needs to be initialized first');
                        }
                        return [4 /*yield*/, this.keyVaultClient.getPublicKey(keyName)];
                    case 1:
                        publicKey = _a.sent();
                        pkBuffer = ethUtil.toBuffer(address_1.ensureLeading0x(publicKey.toString(16)));
                        if (!ethUtil.isValidPublic(pkBuffer, true)) {
                            throw new Error("Invalid secp256k1 public key for keyname " + keyName);
                        }
                        address = ethUtil.pubToAddress(pkBuffer, true);
                        return [2 /*return*/, address_1.ensureLeading0x(address.toString('hex'))];
                }
            });
        });
    };
    return AzureHSMWallet;
}(remote_wallet_1.RemoteWallet));
exports.AzureHSMWallet = AzureHSMWallet;
//# sourceMappingURL=azure-hsm-wallet.js.map