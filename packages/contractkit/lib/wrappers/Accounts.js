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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var web3_1 = __importDefault(require("web3"));
var BaseWrapper_1 = require("../wrappers/BaseWrapper");
/**
 * Contract for handling deposits needed for voting.
 */
var AccountsWrapper = /** @class */ (function (_super) {
    __extends(AccountsWrapper, _super);
    function AccountsWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Creates an account.
         */
        _this.createAccount = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.createAccount);
        /**
         * Returns the attestation signer for the specified account.
         * @param account The address of the account.
         * @return The address with which the account can vote.
         */
        _this.getAttestationSigner = BaseWrapper_1.proxyCall(_this.contract.methods.getAttestationSigner);
        /**
         * Returns if the account has authorized an attestation signer
         * @param account The address of the account.
         * @return If the account has authorized an attestation signer
         */
        _this.hasAuthorizedAttestationSigner = BaseWrapper_1.proxyCall(_this.contract.methods.hasAuthorizedAttestationSigner);
        /**
         * Returns the vote signer for the specified account.
         * @param account The address of the account.
         * @return The address with which the account can vote.
         */
        _this.getVoteSigner = BaseWrapper_1.proxyCall(_this.contract.methods.getVoteSigner);
        /**
         * Returns the validator signer for the specified account.
         * @param account The address of the account.
         * @return The address with which the account can register a validator or group.
         */
        _this.getValidatorSigner = BaseWrapper_1.proxyCall(_this.contract.methods.getValidatorSigner);
        /**
         * Returns the account address given the signer for voting
         * @param signer Address that is authorized to sign the tx as voter
         * @return The Account address
         */
        _this.voteSignerToAccount = BaseWrapper_1.proxyCall(_this.contract.methods.voteSignerToAccount);
        /**
         * Returns the account address given the signer for validating
         * @param signer Address that is authorized to sign the tx as validator
         * @return The Account address
         */
        _this.validatorSignerToAccount = BaseWrapper_1.proxyCall(_this.contract.methods.validatorSignerToAccount);
        /**
         * Returns the account associated with `signer`.
         * @param signer The address of the account or previously authorized signer.
         * @dev Fails if the `signer` is not an account or previously authorized signer.
         * @return The associated account.
         */
        _this.signerToAccount = BaseWrapper_1.proxyCall(_this.contract.methods.signerToAccount);
        /**
         * Check if an account already exists.
         * @param account The address of the account
         * @return Returns `true` if account exists. Returns `false` otherwise.
         */
        _this.isAccount = BaseWrapper_1.proxyCall(_this.contract.methods.isAccount);
        /**
         * Check if an address is a signer address
         * @param address The address of the account
         * @return Returns `true` if account exists. Returns `false` otherwise.
         */
        _this.isSigner = BaseWrapper_1.proxyCall(_this.contract.methods.isAuthorizedSigner);
        /**
         * Returns the set data encryption key for the account
         * @param account Account
         */
        _this.getDataEncryptionKey = BaseWrapper_1.proxyCall(_this.contract.methods.getDataEncryptionKey, undefined, function (res) {
            return BaseWrapper_1.solidityBytesToString(res);
        });
        /**
         * Returns the set wallet address for the account
         * @param account Account
         */
        _this.getWalletAddress = BaseWrapper_1.proxyCall(_this.contract.methods.getWalletAddress);
        /**
         * Returns the metadataURL for the account
         * @param account Account
         */
        _this.getMetadataURL = BaseWrapper_1.proxyCall(_this.contract.methods.getMetadataURL);
        /**
         * Sets the data encryption of the account
         * @param encryptionKey The key to set
         */
        _this.setAccountDataEncryptionKey = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setAccountDataEncryptionKey);
        /**
         * Sets the name for the account
         * @param name The name to set
         */
        _this.setName = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setName);
        /**
         * Sets the metadataURL for the account
         * @param url The url to set
         */
        _this.setMetadataURL = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setMetadataURL);
        return _this;
    }
    AccountsWrapper.prototype.getCurrentSigners = function (address) {
        return Promise.all([
            this.getVoteSigner(address),
            this.getValidatorSigner(address),
            this.getAttestationSigner(address),
        ]);
    };
    AccountsWrapper.prototype.getAccountSummary = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.getName(account),
                            this.getVoteSigner(account),
                            this.getValidatorSigner(account),
                            this.getAttestationSigner(account),
                            this.getMetadataURL(account),
                            this.getWalletAddress(account),
                            this.getDataEncryptionKey(account),
                        ])];
                    case 1:
                        ret = _a.sent();
                        return [2 /*return*/, {
                                address: account,
                                name: ret[0],
                                authorizedSigners: {
                                    vote: ret[1],
                                    validator: ret[2],
                                    attestation: ret[3],
                                },
                                metadataURL: ret[4],
                                wallet: ret[5],
                                dataEncryptionKey: ret[6],
                            }];
                }
            });
        });
    };
    /**
     * Authorize an attestation signing key on behalf of this account to another address.
     * @param signer The address of the signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    AccountsWrapper.prototype.authorizeAttestationSigner = function (signer, proofOfSigningKeyPossession) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.authorizeAttestationSigner(signer, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s))];
            });
        });
    };
    /**
     * Authorizes an address to sign votes on behalf of the account.
     * @param signer The address of the vote signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    AccountsWrapper.prototype.authorizeVoteSigner = function (signer, proofOfSigningKeyPossession) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.authorizeVoteSigner(signer, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s))];
            });
        });
    };
    /**
     * Authorizes an address to sign consensus messages on behalf of the account.
     * @param signer The address of the signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    AccountsWrapper.prototype.authorizeValidatorSigner = function (signer, proofOfSigningKeyPossession) {
        return __awaiter(this, void 0, void 0, function () {
            var validators, account, _a, message, prefixedMsg, pubKey;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 1:
                        validators = _b.sent();
                        _a = this.kit.defaultAccount;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.kit.web3.eth.getAccounts()];
                    case 2:
                        _a = (_b.sent())[0];
                        _b.label = 3;
                    case 3:
                        account = _a;
                        return [4 /*yield*/, validators.isValidator(account)];
                    case 4:
                        if (_b.sent()) {
                            message = this.kit.web3.utils.soliditySha3({ type: 'address', value: account });
                            prefixedMsg = signatureUtils_1.hashMessageWithPrefix(message);
                            pubKey = signatureUtils_1.signedMessageToPublicKey(prefixedMsg, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s);
                            return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.authorizeValidatorSignerWithPublicKey(signer, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s, BaseWrapper_1.stringToSolidityBytes(pubKey)))];
                        }
                        else {
                            return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.authorizeValidatorSigner(signer, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s))];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Authorizes an address to sign consensus messages on behalf of the account. Also switch BLS key at the same time.
     * @param signer The address of the signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
     *   of possession. 48 bytes.
     * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
     *   account address. 96 bytes.
     * @return A CeloTransactionObject
     */
    AccountsWrapper.prototype.authorizeValidatorSignerAndBls = function (signer, proofOfSigningKeyPossession, blsPublicKey, blsPop) {
        return __awaiter(this, void 0, void 0, function () {
            var account, _a, message, prefixedMsg, pubKey;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.kit.defaultAccount;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.kit.web3.eth.getAccounts()];
                    case 1:
                        _a = (_b.sent())[0];
                        _b.label = 2;
                    case 2:
                        account = _a;
                        message = this.kit.web3.utils.soliditySha3({ type: 'address', value: account });
                        prefixedMsg = signatureUtils_1.hashMessageWithPrefix(message);
                        pubKey = signatureUtils_1.signedMessageToPublicKey(prefixedMsg, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s);
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.authorizeValidatorSignerWithKeys(signer, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s, BaseWrapper_1.stringToSolidityBytes(pubKey), BaseWrapper_1.stringToSolidityBytes(blsPublicKey), BaseWrapper_1.stringToSolidityBytes(blsPop)))];
                }
            });
        });
    };
    AccountsWrapper.prototype.generateProofOfKeyPossession = function (account, signer) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getParsedSignatureOfAddress(account, signer, signatureUtils_1.NativeSigner(this.kit.web3.eth.sign, signer))];
            });
        });
    };
    AccountsWrapper.prototype.generateProofOfKeyPossessionLocally = function (account, signer, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getParsedSignatureOfAddress(account, signer, signatureUtils_1.LocalSigner(privateKey))];
            });
        });
    };
    /**
     * Returns the set name for the account
     * @param account Account
     * @param blockNumber Height of result, defaults to tip.
     */
    AccountsWrapper.prototype.getName = function (account, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // @ts-ignore: Expected 0-1 arguments, but got 2
                return [2 /*return*/, this.contract.methods.getName(account).call({}, blockNumber)];
            });
        });
    };
    /**
     * Convenience Setter for the dataEncryptionKey and wallet address for an account
     * @param name A string to set as the name of the account
     * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
     * @param walletAddress The wallet address to set for the account
     * @param proofOfPossession Signature from the wallet address key over the sender's address
     */
    AccountsWrapper.prototype.setAccount = function (name, dataEncryptionKey, walletAddress, proofOfPossession) {
        if (proofOfPossession === void 0) { proofOfPossession = null; }
        if (proofOfPossession) {
            return BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.setAccount(name, 
            // @ts-ignore
            dataEncryptionKey, walletAddress, proofOfPossession.v, proofOfPossession.r, proofOfPossession.s));
        }
        else {
            return BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.setAccount(name, 
            // @ts-ignore
            dataEncryptionKey, walletAddress, '0x0', '0x0', '0x0'));
        }
    };
    /**
     * Sets the wallet address for the account
     * @param address The address to set
     */
    AccountsWrapper.prototype.setWalletAddress = function (walletAddress, proofOfPossession) {
        if (proofOfPossession === void 0) { proofOfPossession = null; }
        if (proofOfPossession) {
            return BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.setWalletAddress(walletAddress, proofOfPossession.v, proofOfPossession.r, proofOfPossession.s));
        }
        else {
            return BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.setWalletAddress(walletAddress, '0x0', '0x0', '0x0'));
        }
    };
    AccountsWrapper.prototype.parseSignatureOfAddress = function (address, signer, signature) {
        var hash = web3_1.default.utils.soliditySha3({ type: 'address', value: address });
        return signatureUtils_1.parseSignature(hash, signature, signer);
    };
    AccountsWrapper.prototype.getParsedSignatureOfAddress = function (address, signer, signerFn) {
        return __awaiter(this, void 0, void 0, function () {
            var hash, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hash = web3_1.default.utils.soliditySha3({ type: 'address', value: address });
                        return [4 /*yield*/, signerFn.sign(hash)];
                    case 1:
                        signature = _a.sent();
                        return [2 /*return*/, signatureUtils_1.parseSignature(hash, signature, signer)];
                }
            });
        });
    };
    return AccountsWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.AccountsWrapper = AccountsWrapper;
//# sourceMappingURL=Accounts.js.map