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
var address_1 = require("@celo/utils/lib/address");
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Contract for handling an instance of a ReleaseGold contract.
 */
var ReleaseGoldWrapper = /** @class */ (function (_super) {
    __extends(ReleaseGoldWrapper, _super);
    function ReleaseGoldWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Returns the beneficiary of the ReleaseGold contract
         * @return The address of the beneficiary.
         */
        _this.getBeneficiary = BaseWrapper_1.proxyCall(_this.contract.methods.beneficiary);
        /**
         * Returns the releaseOwner address of the ReleaseGold contract
         * @return The address of the releaseOwner.
         */
        _this.getReleaseOwner = BaseWrapper_1.proxyCall(_this.contract.methods.releaseOwner);
        /**
         * Returns the refund address of the ReleaseGold contract
         * @return The refundAddress.
         */
        _this.getRefundAddress = BaseWrapper_1.proxyCall(_this.contract.methods.refundAddress);
        /**
         * Returns the owner's address of the ReleaseGold contract
         * @return The owner's address.
         */
        _this.getOwner = BaseWrapper_1.proxyCall(_this.contract.methods.owner);
        /**
         * Returns true if the liquidity provision has been met for this contract
         * @return If the liquidity provision is met.
         */
        _this.getLiquidityProvisionMet = BaseWrapper_1.proxyCall(_this.contract.methods.liquidityProvisionMet);
        /**
         * Returns true if the contract can validate
         * @return If the contract can validate
         */
        _this.getCanValidate = BaseWrapper_1.proxyCall(_this.contract.methods.canValidate);
        /**
         * Returns true if the contract can vote
         * @return If the contract can vote
         */
        _this.getCanVote = BaseWrapper_1.proxyCall(_this.contract.methods.canVote);
        /**
         * Returns the total withdrawn amount from the ReleaseGold contract
         * @return The total withdrawn amount from the ReleaseGold contract
         */
        _this.getTotalWithdrawn = BaseWrapper_1.proxyCall(_this.contract.methods.totalWithdrawn, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the maximum amount of gold (regardless of release schedule)
         * currently allowed for release.
         * @return The max amount of gold currently withdrawable.
         */
        _this.getMaxDistribution = BaseWrapper_1.proxyCall(_this.contract.methods.maxDistribution, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Indicates if the release grant is revoked or not
         * @return A boolean indicating revoked releasing (true) or non-revoked(false).
         */
        _this.isRevoked = BaseWrapper_1.proxyCall(_this.contract.methods.isRevoked);
        /**
         * Returns the total balance of the ReleaseGold instance
         * @return The total ReleaseGold instance balance
         */
        _this.getTotalBalance = BaseWrapper_1.proxyCall(_this.contract.methods.getTotalBalance, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the the sum of locked and unlocked gold in the ReleaseGold instance
         * @return The remaining total ReleaseGold instance balance
         */
        _this.getRemainingTotalBalance = BaseWrapper_1.proxyCall(_this.contract.methods.getRemainingTotalBalance, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the remaining unlocked gold balance in the ReleaseGold instance
         * @return The available unlocked ReleaseGold instance gold balance
         */
        _this.getRemainingUnlockedBalance = BaseWrapper_1.proxyCall(_this.contract.methods.getRemainingUnlockedBalance, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the remaining locked gold balance in the ReleaseGold instance
         * @return The remaining locked ReleaseGold instance gold balance
         */
        _this.getRemainingLockedBalance = BaseWrapper_1.proxyCall(_this.contract.methods.getRemainingLockedBalance, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the total amount that has already released up to now
         * @return The already released gold amount up to the point of call
         */
        _this.getCurrentReleasedTotalAmount = BaseWrapper_1.proxyCall(_this.contract.methods.getCurrentReleasedTotalAmount, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Locks gold to be used for voting.
         * @param value The amount of gold to lock
         */
        _this.lockGold = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.lockGold, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        _this.transfer = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transfer, BaseWrapper_1.tupleParser(BaseWrapper_1.stringIdentity, BaseWrapper_1.valueToString));
        /**
         * Unlocks gold that becomes withdrawable after the unlocking period.
         * @param value The amount of gold to unlock
         */
        _this.unlockGold = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.unlockGold, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Relocks gold that has been unlocked but not withdrawn.
         * @param index The index of the pending withdrawal to relock from.
         * @param value The value to relock from the specified pending withdrawal.
         */
        _this._relockGold = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.relockGold, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString, BaseWrapper_1.valueToString));
        /**
         * Withdraw gold in the ReleaseGold instance that has been unlocked but not withdrawn.
         * @param index The index of the pending locked gold withdrawal
         */
        _this.withdrawLockedGold = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.withdrawLockedGold, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Transfer released gold from the ReleaseGold instance back to beneficiary.
         * @param value The requested gold amount
         */
        _this.withdraw = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.withdraw, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Beneficiary creates an account on behalf of the ReleaseGold contract.
         */
        _this.createAccount = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.createAccount);
        /**
         * Beneficiary creates an account on behalf of the ReleaseGold contract.
         * @param name The name to set
         * @param dataEncryptionKey The key to set
         * @param walletAddress The address to set
         */
        _this.setAccount = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setAccount);
        /**
         * Sets the name for the account
         * @param name The name to set
         */
        _this.setAccountName = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setAccountName);
        /**
         * Sets the metadataURL for the account
         * @param metadataURL The url to set
         */
        _this.setAccountMetadataURL = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setAccountMetadataURL);
        /**
         * Sets the wallet address for the account
         * @param walletAddress The address to set
         */
        _this.setAccountWalletAddress = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setAccountWalletAddress);
        /**
         * Sets the data encryption of the account
         * @param dataEncryptionKey The key to set
         */
        _this.setAccountDataEncryptionKey = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setAccountDataEncryptionKey);
        /**
         * Sets the contract's liquidity provision to true
         */
        _this.setLiquidityProvision = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setLiquidityProvision);
        /**
         * Sets the contract's `canExpire` field to `_canExpire`
         * @param _canExpire If the contract can expire `EXPIRATION_TIME` after the release schedule finishes.
         */
        _this.setCanExpire = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setCanExpire);
        /**
         * Sets the contract's max distribution
         */
        _this.setMaxDistribution = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setMaxDistribution);
        /**
         * Sets the contract's beneficiary
         */
        _this.setBeneficiary = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setBeneficiary);
        return _this;
    }
    /**
     * Returns the underlying Release schedule of the ReleaseGold contract
     * @return A ReleaseSchedule.
     */
    ReleaseGoldWrapper.prototype.getReleaseSchedule = function () {
        return __awaiter(this, void 0, void 0, function () {
            var releaseSchedule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.releaseSchedule().call()];
                    case 1:
                        releaseSchedule = _a.sent();
                        return [2 /*return*/, {
                                releaseStartTime: BaseWrapper_1.valueToInt(releaseSchedule.releaseStartTime),
                                releaseCliff: BaseWrapper_1.valueToInt(releaseSchedule.releaseCliff),
                                numReleasePeriods: BaseWrapper_1.valueToInt(releaseSchedule.numReleasePeriods),
                                releasePeriod: BaseWrapper_1.valueToInt(releaseSchedule.releasePeriod),
                                amountReleasedPerPeriod: BaseWrapper_1.valueToBigNumber(releaseSchedule.amountReleasedPerPeriod),
                            }];
                }
            });
        });
    };
    /**
     * Returns the underlying Revocation Info of the ReleaseGold contract
     * @return A RevocationInfo struct.
     */
    ReleaseGoldWrapper.prototype.getRevocationInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var revocationInfo, _1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.contract.methods.revocationInfo().call()];
                    case 1:
                        revocationInfo = _a.sent();
                        return [2 /*return*/, {
                                revocable: revocationInfo.revocable,
                                canExpire: revocationInfo.canExpire,
                                releasedBalanceAtRevoke: BaseWrapper_1.valueToBigNumber(revocationInfo.releasedBalanceAtRevoke),
                                revokeTime: BaseWrapper_1.valueToInt(revocationInfo.revokeTime),
                            }];
                    case 2:
                        _1 = _a.sent();
                        // This error is caused by a mismatch between the deployed contract and the locally compiled version.
                        // Specifically, networks like baklava and rc0 were deployed before adding `canExpire`.
                        console.info('Some info could not be fetched, returning default for revocation info.');
                        return [2 /*return*/, {
                                revocable: false,
                                canExpire: false,
                                releasedBalanceAtRevoke: new bignumber_js_1.default(0),
                                revokeTime: 0,
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Indicates if the release grant is revocable or not
     * @return A boolean indicating revocable releasing (true) or non-revocable(false).
     */
    ReleaseGoldWrapper.prototype.isRevocable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var revocationInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRevocationInfo()];
                    case 1:
                        revocationInfo = _a.sent();
                        return [2 /*return*/, revocationInfo.revocable];
                }
            });
        });
    };
    /**
     * Returns the time at which the release schedule was revoked
     * @return The timestamp of the release schedule revocation
     */
    ReleaseGoldWrapper.prototype.getRevokeTime = function () {
        return __awaiter(this, void 0, void 0, function () {
            var revocationInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRevocationInfo()];
                    case 1:
                        revocationInfo = _a.sent();
                        return [2 /*return*/, revocationInfo.revokeTime];
                }
            });
        });
    };
    /**
     * Returns the balance of released gold when the grant was revoked
     * @return The balance at revocation time. 0 can also indicate not revoked.
     */
    ReleaseGoldWrapper.prototype.getReleasedBalanceAtRevoke = function () {
        return __awaiter(this, void 0, void 0, function () {
            var revocationInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRevocationInfo()];
                    case 1:
                        revocationInfo = _a.sent();
                        return [2 /*return*/, revocationInfo.releasedBalanceAtRevoke.toString()];
                }
            });
        });
    };
    /**
     * Revoke a Release schedule
     * @return A CeloTransactionObject
     */
    ReleaseGoldWrapper.prototype.revokeReleasing = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.revoke())];
            });
        });
    };
    /**
     * Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.
     * @return A CeloTransactionObject
     */
    ReleaseGoldWrapper.prototype.refundAndFinalize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.refundAndFinalize())];
            });
        });
    };
    /**
     * Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.
     * @param index The index of the pending withdrawal to relock from.
     * @param value The value to relock from the specified pending withdrawal.
     */
    ReleaseGoldWrapper.prototype.relockGold = function (value) {
        return __awaiter(this, void 0, void 0, function () {
            var lockedGold, pendingWithdrawals, totalValue, throwIfNotSorted, remainingToRelock, relockPw;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getLockedGold()];
                    case 1:
                        lockedGold = _a.sent();
                        return [4 /*yield*/, lockedGold.getPendingWithdrawals(this.address)
                            // Ensure there are enough pending withdrawals to relock.
                        ];
                    case 2:
                        pendingWithdrawals = _a.sent();
                        return [4 /*yield*/, lockedGold.getPendingWithdrawalsTotalValue(this.address)];
                    case 3:
                        totalValue = _a.sent();
                        if (totalValue.isLessThan(value)) {
                            throw new Error("Not enough pending withdrawals to relock " + value);
                        }
                        throwIfNotSorted = function (pw, i) {
                            if (i > 0 && !pw.time.isGreaterThanOrEqualTo(pendingWithdrawals[i - 1].time)) {
                                throw new Error('Pending withdrawals not sorted by timestamp');
                            }
                        };
                        pendingWithdrawals.forEach(throwIfNotSorted);
                        remainingToRelock = new bignumber_js_1.default(value);
                        relockPw = function (acc, pw, i) {
                            var valueToRelock = bignumber_js_1.default.minimum(pw.value, remainingToRelock);
                            if (!valueToRelock.isZero()) {
                                remainingToRelock = remainingToRelock.minus(valueToRelock);
                                acc.push(_this._relockGold(i, valueToRelock));
                            }
                            return acc;
                        };
                        return [2 /*return*/, pendingWithdrawals.reduceRight(relockPw, [])];
                }
            });
        });
    };
    /**
     * Authorizes an address to sign votes on behalf of the account.
     * @param signer The address of the vote signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    ReleaseGoldWrapper.prototype.authorizeVoteSigner = function (signer, proofOfSigningKeyPossession) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.authorizeVoteSigner(signer, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s))];
            });
        });
    };
    /**
     * Authorizes an address to sign validation messages on behalf of the account.
     * @param signer The address of the validator signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    ReleaseGoldWrapper.prototype.authorizeValidatorSigner = function (signer, proofOfSigningKeyPossession) {
        return __awaiter(this, void 0, void 0, function () {
            var validators, account, message, prefixedMsg, pubKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 1:
                        validators = _a.sent();
                        account = this.address;
                        return [4 /*yield*/, validators.isValidator(account)];
                    case 2:
                        if (_a.sent()) {
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
     * Authorizes an address to sign consensus messages on behalf of the contract's account. Also switch BLS key at the same time.
     * @param signer The address of the signing key to authorize.
     * @param proofOfSigningKeyPossession The contract's account address signed by the signer address.
     * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
     *   of possession. 48 bytes.
     * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
     *   account address. 96 bytes.
     * @return A CeloTransactionObject
     */
    ReleaseGoldWrapper.prototype.authorizeValidatorSignerAndBls = function (signer, proofOfSigningKeyPossession, blsPublicKey, blsPop) {
        return __awaiter(this, void 0, void 0, function () {
            var account, message, prefixedMsg, pubKey;
            return __generator(this, function (_a) {
                account = this.address;
                message = this.kit.web3.utils.soliditySha3({ type: 'address', value: account });
                prefixedMsg = signatureUtils_1.hashMessageWithPrefix(message);
                pubKey = signatureUtils_1.signedMessageToPublicKey(prefixedMsg, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s);
                return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.authorizeValidatorSignerWithKeys(signer, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s, BaseWrapper_1.stringToSolidityBytes(pubKey), BaseWrapper_1.stringToSolidityBytes(blsPublicKey), BaseWrapper_1.stringToSolidityBytes(blsPop)))];
            });
        });
    };
    /**
     * Authorizes an address to sign attestation messages on behalf of the account.
     * @param signer The address of the attestation signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    ReleaseGoldWrapper.prototype.authorizeAttestationSigner = function (signer, proofOfSigningKeyPossession) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.authorizeAttestationSigner(signer, proofOfSigningKeyPossession.v, proofOfSigningKeyPossession.r, proofOfSigningKeyPossession.s))];
            });
        });
    };
    /**
     * Revokes pending votes
     * @param account The account to revoke from.
     * @param validatorGroup The group to revoke the vote for.
     * @param value The amount of gold to revoke.
     */
    ReleaseGoldWrapper.prototype.revokePending = function (account, group, value) {
        return __awaiter(this, void 0, void 0, function () {
            var electionContract, groups, index, _a, lesser, greater;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 1:
                        electionContract = _b.sent();
                        return [4 /*yield*/, electionContract.getGroupsVotedForByAccount(account)];
                    case 2:
                        groups = _b.sent();
                        index = address_1.findAddressIndex(group, groups);
                        return [4 /*yield*/, electionContract.findLesserAndGreaterAfterVote(group, value.times(-1))];
                    case 3:
                        _a = _b.sent(), lesser = _a.lesser, greater = _a.greater;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.revokePending(group, value.toFixed(), lesser, greater, index))];
                }
            });
        });
    };
    /**
     * Revokes active votes
     * @param account The account to revoke from.
     * @param validatorGroup The group to revoke the vote for.
     * @param value The amount of gold to revoke.
     */
    ReleaseGoldWrapper.prototype.revokeActive = function (account, group, value) {
        return __awaiter(this, void 0, void 0, function () {
            var electionContract, groups, index, _a, lesser, greater;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 1:
                        electionContract = _b.sent();
                        return [4 /*yield*/, electionContract.getGroupsVotedForByAccount(account)];
                    case 2:
                        groups = _b.sent();
                        index = address_1.findAddressIndex(group, groups);
                        return [4 /*yield*/, electionContract.findLesserAndGreaterAfterVote(group, value.times(-1))];
                    case 3:
                        _a = _b.sent(), lesser = _a.lesser, greater = _a.greater;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.revokeActive(group, value.toFixed(), lesser, greater, index))];
                }
            });
        });
    };
    ReleaseGoldWrapper.prototype.revoke = function (account, group, value) {
        return __awaiter(this, void 0, void 0, function () {
            var electionContract, vote, txos, pendingValue, _a, _b, activeValue, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 1:
                        electionContract = _e.sent();
                        return [4 /*yield*/, electionContract.getVotesForGroupByAccount(account, group)];
                    case 2:
                        vote = _e.sent();
                        if (value.gt(vote.pending.plus(vote.active))) {
                            throw new Error("can't revoke more votes for " + group + " than have been made by " + account);
                        }
                        txos = [];
                        pendingValue = bignumber_js_1.default.minimum(vote.pending, value);
                        if (!!pendingValue.isZero()) return [3 /*break*/, 4];
                        _b = (_a = txos).push;
                        return [4 /*yield*/, this.revokePending(account, group, pendingValue)];
                    case 3:
                        _b.apply(_a, [_e.sent()]);
                        _e.label = 4;
                    case 4:
                        if (!pendingValue.lt(value)) return [3 /*break*/, 6];
                        activeValue = value.minus(pendingValue);
                        _d = (_c = txos).push;
                        return [4 /*yield*/, this.revokeActive(account, group, activeValue)];
                    case 5:
                        _d.apply(_c, [_e.sent()]);
                        _e.label = 6;
                    case 6: return [2 /*return*/, txos];
                }
            });
        });
    };
    return ReleaseGoldWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.ReleaseGoldWrapper = ReleaseGoldWrapper;
//# sourceMappingURL=ReleaseGold.js.map