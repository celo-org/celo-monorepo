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
var async_1 = require("@celo/utils/lib/async");
var collections_1 = require("@celo/utils/lib/collections");
var fixidity_1 = require("@celo/utils/lib/fixidity");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var base_1 = require("../base");
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Contract for voting for validators and managing validator groups.
 */
// TODO(asa): Support validator signers
var ValidatorsWrapper = /** @class */ (function (_super) {
    __extends(ValidatorsWrapper, _super);
    function ValidatorsWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Queues an update to a validator group's commission.
         * @param commission Fixidity representation of the commission this group receives on epoch
         *   payments made to its members. Must be in the range [0, 1.0].
         */
        _this.setNextCommissionUpdate = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setNextCommissionUpdate, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToFixidityString));
        /**
         * Updates a validator group's commission based on the previously queued update
         */
        _this.updateCommission = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.updateCommission);
        /**
         * Returns the Locked Gold requirements for specific account.
         * @returns The Locked Gold requirements for a specific account.
         */
        _this.getAccountLockedGoldRequirement = BaseWrapper_1.proxyCall(_this.contract.methods.getAccountLockedGoldRequirement, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the reset period, in seconds, for slashing multiplier.
         */
        _this.getSlashingMultiplierResetPeriod = BaseWrapper_1.proxyCall(_this.contract.methods.slashingMultiplierResetPeriod, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the update delay, in blocks, for the group commission.
         */
        _this.getCommissionUpdateDelay = BaseWrapper_1.proxyCall(_this.contract.methods.commissionUpdateDelay, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Updates a validator's BLS key.
         * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
         *   of possession. 48 bytes.
         * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
         *   account address. 96 bytes.
         * @return True upon success.
         */
        _this.updateBlsPublicKey = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.updateBlsPublicKey, BaseWrapper_1.tupleParser(BaseWrapper_1.stringToSolidityBytes, BaseWrapper_1.stringToSolidityBytes));
        /**
         * Returns whether a particular account has a registered validator.
         * @param account The account.
         * @return Whether a particular address is a registered validator.
         */
        _this.isValidator = BaseWrapper_1.proxyCall(_this.contract.methods.isValidator);
        /**
         * Returns whether a particular account has a registered validator group.
         * @param account The account.
         * @return Whether a particular address is a registered validator group.
         */
        _this.isValidatorGroup = BaseWrapper_1.proxyCall(_this.contract.methods.isValidatorGroup);
        /**
         * Returns whether an account meets the requirements to register a validator.
         * @param account The account.
         * @return Whether an account meets the requirements to register a validator.
         */
        _this.meetsValidatorBalanceRequirements = function (address) { return __awaiter(_this, void 0, void 0, function () {
            var lockedGold, total, reqs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getLockedGold()];
                    case 1:
                        lockedGold = _a.sent();
                        return [4 /*yield*/, lockedGold.getAccountTotalLockedGold(address)];
                    case 2:
                        total = _a.sent();
                        return [4 /*yield*/, this.getValidatorLockedGoldRequirements()];
                    case 3:
                        reqs = _a.sent();
                        return [2 /*return*/, reqs.value.lte(total)];
                }
            });
        }); };
        /**
         * Returns whether an account meets the requirements to register a group.
         * @param account The account.
         * @return Whether an account meets the requirements to register a group.
         */
        _this.meetsValidatorGroupBalanceRequirements = function (address) { return __awaiter(_this, void 0, void 0, function () {
            var lockedGold, total, reqs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getLockedGold()];
                    case 1:
                        lockedGold = _a.sent();
                        return [4 /*yield*/, lockedGold.getAccountTotalLockedGold(address)];
                    case 2:
                        total = _a.sent();
                        return [4 /*yield*/, this.getGroupLockedGoldRequirements()];
                    case 3:
                        reqs = _a.sent();
                        return [2 /*return*/, reqs.value.lte(total)];
                }
            });
        }); };
        /**
         * Returns the Validator's group membership history
         * @param validator The validator whose membership history to return.
         * @return The group membership history of a validator.
         */
        _this.getValidatorMembershipHistory = BaseWrapper_1.proxyCall(_this.contract.methods.getMembershipHistory, undefined, function (res) {
            return collections_1.zip(function (epoch, group) { return ({ epoch: BaseWrapper_1.valueToInt(epoch), group: group }); }, res[0], res[1]);
        });
        /**
         * Returns extra data from the Validator's group membership history
         * @param validator The validator whose membership history to return.
         * @return The group membership history of a validator.
         */
        _this.getValidatorMembershipHistoryExtraData = BaseWrapper_1.proxyCall(_this.contract.methods.getMembershipHistory, undefined, function (res) { return ({ lastRemovedFromGroupTimestamp: BaseWrapper_1.valueToInt(res[2]), tail: BaseWrapper_1.valueToInt(res[3]) }); });
        /** Get the size (amount of members) of a ValidatorGroup */
        _this.getValidatorGroupSize = BaseWrapper_1.proxyCall(_this.contract.methods.getGroupNumMembers, undefined, BaseWrapper_1.valueToInt);
        /** Get list of registered validator group addresses */
        _this.getRegisteredValidatorGroupsAddresses = BaseWrapper_1.proxyCall(_this.contract.methods.getRegisteredValidatorGroups);
        /**
         * Registers a validator unaffiliated with any validator group.
         *
         * Fails if the account is already a validator or validator group.
         *
         * @param validatorAddress The address that the validator is using for consensus, should match
         *   the validator signer.
         * @param ecdsaPublicKey The ECDSA public key that the validator is using for consensus. 64 bytes.
         * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
         *   of possession. 48 bytes.
         * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
         *   account address. 96 bytes.
         */
        _this.getEpochNumber = BaseWrapper_1.proxyCall(_this.contract.methods.getEpochNumber, undefined, BaseWrapper_1.valueToBigNumber);
        _this.getEpochSize = BaseWrapper_1.proxyCall(_this.contract.methods.getEpochSize, undefined, BaseWrapper_1.valueToBigNumber);
        _this.registerValidator = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.registerValidator, BaseWrapper_1.tupleParser(BaseWrapper_1.stringToSolidityBytes, BaseWrapper_1.stringToSolidityBytes, BaseWrapper_1.stringToSolidityBytes));
        /**
         * Affiliates a validator with a group, allowing it to be added as a member.
         * De-affiliates with the previously affiliated group if present.
         * @param group The validator group with which to affiliate.
         */
        _this.affiliate = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.affiliate);
        /**
         * De-affiliates a validator, removing it from the group for which it is a member.
         * Fails if the account is not a validator with non-zero affiliation.
         */
        _this.deaffiliate = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.deaffiliate);
        /**
         * Removes a validator from the group for which it is a member.
         * @param validatorAccount The validator to deaffiliate from their affiliated validator group.
         */
        _this.forceDeaffiliateIfValidator = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.forceDeaffiliateIfValidator);
        /**
         * Resets a group's slashing multiplier if it has been >= the reset period since
         * the last time the group was slashed.
         */
        _this.resetSlashingMultiplier = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.resetSlashingMultiplier);
        /**
         * Removes a member from a ValidatorGroup
         * The ValidatorGroup is specified by the `from` of the tx.
         *
         * @param validator The Validator to remove from the group
         */
        _this.removeMember = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.removeMember);
        return _this;
    }
    /**
     * Returns the Locked Gold requirements for validators.
     * @returns The Locked Gold requirements for validators.
     */
    ValidatorsWrapper.prototype.getValidatorLockedGoldRequirements = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getValidatorLockedGoldRequirements().call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                value: BaseWrapper_1.valueToBigNumber(res[0]),
                                duration: BaseWrapper_1.valueToBigNumber(res[1]),
                            }];
                }
            });
        });
    };
    /**
     * Returns the Locked Gold requirements for validator groups.
     * @returns The Locked Gold requirements for validator groups.
     */
    ValidatorsWrapper.prototype.getGroupLockedGoldRequirements = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getGroupLockedGoldRequirements().call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                value: BaseWrapper_1.valueToBigNumber(res[0]),
                                duration: BaseWrapper_1.valueToBigNumber(res[1]),
                            }];
                }
            });
        });
    };
    /**
     * Returns current configuration parameters.
     */
    ValidatorsWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.getValidatorLockedGoldRequirements(),
                            this.getGroupLockedGoldRequirements(),
                            this.contract.methods.maxGroupSize().call(),
                            this.contract.methods.membershipHistoryLength().call(),
                            this.getSlashingMultiplierResetPeriod(),
                            this.getCommissionUpdateDelay(),
                        ])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                validatorLockedGoldRequirements: res[0],
                                groupLockedGoldRequirements: res[1],
                                maxGroupSize: BaseWrapper_1.valueToBigNumber(res[2]),
                                membershipHistoryLength: BaseWrapper_1.valueToBigNumber(res[3]),
                                slashingMultiplierResetPeriod: res[4],
                                commissionUpdateDelay: res[5],
                            }];
                }
            });
        });
    };
    /**
     * Returns the account associated with `signer`.
     * @param signer The address of an account or currently authorized validator signer.
     * @dev Fails if the `signer` is not an account or currently authorized validator.
     * @return The associated account.
     */
    ValidatorsWrapper.prototype.validatorSignerToAccount = function (signerAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [2 /*return*/, accounts.validatorSignerToAccount(signerAddress)];
                }
            });
        });
    };
    /**
     * Returns the account associated with `signer`.
     * @param signer The address of the account or previously authorized signer.
     * @dev Fails if the `signer` is not an account or previously authorized signer.
     * @return The associated account.
     */
    ValidatorsWrapper.prototype.signerToAccount = function (signerAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [2 /*return*/, accounts.signerToAccount(signerAddress)];
                }
            });
        });
    };
    /** Get Validator information */
    ValidatorsWrapper.prototype.getValidator = function (address, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var res, accounts, name;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getValidator(address).call({}, blockNumber)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 2:
                        accounts = _a.sent();
                        return [4 /*yield*/, accounts.getName(address, blockNumber)];
                    case 3:
                        name = (_a.sent()) || '';
                        return [2 /*return*/, {
                                name: name,
                                address: address,
                                ecdsaPublicKey: res.ecdsaPublicKey,
                                blsPublicKey: res.blsPublicKey,
                                affiliation: res.affiliation,
                                score: fixidity_1.fromFixed(new bignumber_js_1.default(res.score)),
                                signer: res.signer,
                            }];
                }
            });
        });
    };
    ValidatorsWrapper.prototype.getValidatorFromSigner = function (address, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var account, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.signerToAccount(address)];
                    case 1:
                        account = _b.sent();
                        _a = address_1.eqAddress(account, base_1.NULL_ADDRESS);
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.isValidator(account)];
                    case 2:
                        _a = !(_b.sent());
                        _b.label = 3;
                    case 3:
                        if (_a) {
                            return [2 /*return*/, {
                                    name: 'Unregistered validator',
                                    address: address,
                                    ecdsaPublicKey: '',
                                    blsPublicKey: '',
                                    affiliation: '',
                                    score: new bignumber_js_1.default(0),
                                    signer: address,
                                }];
                        }
                        else {
                            return [2 /*return*/, this.getValidator(account, blockNumber)];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Get ValidatorGroup information */
    ValidatorsWrapper.prototype.getValidatorGroup = function (address, getAffiliates, blockNumber) {
        if (getAffiliates === void 0) { getAffiliates = true; }
        return __awaiter(this, void 0, void 0, function () {
            var res, accounts, name, affiliates, validators;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getValidatorGroup(address).call({}, blockNumber)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 2:
                        accounts = _a.sent();
                        return [4 /*yield*/, accounts.getName(address, blockNumber)];
                    case 3:
                        name = (_a.sent()) || '';
                        affiliates = [];
                        if (!getAffiliates) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.getRegisteredValidators(blockNumber)];
                    case 4:
                        validators = _a.sent();
                        affiliates = validators
                            .filter(function (v) { return v.affiliation && address_1.eqAddress(v.affiliation, address); })
                            .filter(function (v) { return !res[0].includes(v.address); });
                        _a.label = 5;
                    case 5: return [2 /*return*/, {
                            name: name,
                            address: address,
                            members: res[0],
                            commission: fixidity_1.fromFixed(new bignumber_js_1.default(res[1])),
                            nextCommission: fixidity_1.fromFixed(new bignumber_js_1.default(res[2])),
                            nextCommissionBlock: new bignumber_js_1.default(res[3]),
                            membersUpdated: res[4].reduce(function (a, b) { return Math.max(a, new bignumber_js_1.default(b).toNumber()); }, 0),
                            affiliates: affiliates.map(function (v) { return v.address; }),
                            slashingMultiplier: fixidity_1.fromFixed(new bignumber_js_1.default(res[5])),
                            lastSlashed: BaseWrapper_1.valueToBigNumber(res[6]),
                        }];
                }
            });
        });
    };
    /** Get list of registered validator addresses */
    ValidatorsWrapper.prototype.getRegisteredValidatorsAddresses = function (blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // @ts-ignore: Expected 0-1 arguments, but got 2
                return [2 /*return*/, this.contract.methods.getRegisteredValidators().call({}, blockNumber)];
            });
        });
    };
    /** Get list of registered validators */
    ValidatorsWrapper.prototype.getRegisteredValidators = function (blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var vgAddresses;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRegisteredValidatorsAddresses(blockNumber)];
                    case 1:
                        vgAddresses = _a.sent();
                        return [2 /*return*/, async_1.concurrentMap(10, vgAddresses, function (addr) { return _this.getValidator(addr, blockNumber); })];
                }
            });
        });
    };
    /** Get list of registered validator groups */
    ValidatorsWrapper.prototype.getRegisteredValidatorGroups = function () {
        return __awaiter(this, void 0, void 0, function () {
            var vgAddresses;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRegisteredValidatorGroupsAddresses()];
                    case 1:
                        vgAddresses = _a.sent();
                        return [2 /*return*/, async_1.concurrentMap(10, vgAddresses, function (addr) { return _this.getValidatorGroup(addr, false); })];
                }
            });
        });
    };
    /**
     * De-registers a validator, removing it from the group for which it is a member.
     * @param validatorAddress Address of the validator to deregister
     */
    ValidatorsWrapper.prototype.deregisterValidator = function (validatorAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var allValidators, idx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRegisteredValidatorsAddresses()];
                    case 1:
                        allValidators = _a.sent();
                        idx = address_1.findAddressIndex(validatorAddress, allValidators);
                        if (idx < 0) {
                            throw new Error(validatorAddress + " is not a registered validator");
                        }
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.deregisterValidator(idx))];
                }
            });
        });
    };
    /**
     * Registers a validator group with no member validators.
     * Fails if the account is already a validator or validator group.
     * Fails if the account does not have sufficient weight.
     *
     * @param commission the commission this group receives on epoch payments made to its members.
     */
    ValidatorsWrapper.prototype.registerValidatorGroup = function (commission) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.registerValidatorGroup(fixidity_1.toFixed(commission).toFixed()))];
            });
        });
    };
    /**
     * De-registers a validator Group
     * @param validatorGroupAddress Address of the validator group to deregister
     */
    ValidatorsWrapper.prototype.deregisterValidatorGroup = function (validatorGroupAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var allGroups, idx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRegisteredValidatorGroupsAddresses()];
                    case 1:
                        allGroups = _a.sent();
                        idx = address_1.findAddressIndex(validatorGroupAddress, allGroups);
                        if (idx < 0) {
                            throw new Error(validatorGroupAddress + " is not a registered validator");
                        }
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.deregisterValidatorGroup(idx))];
                }
            });
        });
    };
    /**
     * Adds a member to the end of a validator group's list of members.
     * Fails if `validator` has not set their affiliation to this account.
     * @param validator The validator to add to the group
     */
    ValidatorsWrapper.prototype.addMember = function (group, validator) {
        return __awaiter(this, void 0, void 0, function () {
            var numMembers, election, voteWeight, _a, lesser, greater;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getValidatorGroupSize(group)];
                    case 1:
                        numMembers = _b.sent();
                        if (!(numMembers === 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 2:
                        election = _b.sent();
                        return [4 /*yield*/, election.getTotalVotesForGroup(group)];
                    case 3:
                        voteWeight = _b.sent();
                        return [4 /*yield*/, election.findLesserAndGreaterAfterVote(group, voteWeight)];
                    case 4:
                        _a = _b.sent(), lesser = _a.lesser, greater = _a.greater;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.addFirstMember(validator, lesser, greater))];
                    case 5: return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.addMember(validator))];
                }
            });
        });
    };
    /**
     * Reorders a member within a validator group.
     * Fails if `validator` is not a member of the account's validator group.
     * @param groupAddr The validator group
     * @param validator The validator to reorder.
     * @param newIndex New position for the validator
     */
    ValidatorsWrapper.prototype.reorderMember = function (groupAddr, validator, newIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var group, currentIdx, nextMember, prevMember;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getValidatorGroup(groupAddr)];
                    case 1:
                        group = _a.sent();
                        if (newIndex < 0 || newIndex >= group.members.length) {
                            throw new Error("Invalid index " + newIndex + "; max index is " + (group.members.length - 1));
                        }
                        currentIdx = address_1.findAddressIndex(validator, group.members);
                        if (currentIdx < 0) {
                            throw new Error("ValidatorGroup " + groupAddr + " does not include " + validator);
                        }
                        else if (currentIdx === newIndex) {
                            throw new Error("Validator is already in position " + newIndex);
                        }
                        // remove the element
                        group.members.splice(currentIdx, 1);
                        // add it on new position
                        group.members.splice(newIndex, 0, validator);
                        nextMember = newIndex === group.members.length - 1 ? base_1.NULL_ADDRESS : group.members[newIndex + 1];
                        prevMember = newIndex === 0 ? base_1.NULL_ADDRESS : group.members[newIndex - 1];
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.reorderMember(validator, nextMember, prevMember))];
                }
            });
        });
    };
    /**
     * Retrieves ValidatorRewards for epochNumber.
     * @param epochNumber The epoch to retrieve ValidatorRewards at.
     */
    ValidatorsWrapper.prototype.getValidatorRewards = function (epochNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var blockNumber, events, validator, validatorGroup;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.getLastBlockNumberForEpoch(epochNumber)];
                    case 1:
                        blockNumber = _a.sent();
                        return [4 /*yield*/, this.getPastEvents('ValidatorEpochPaymentDistributed', {
                                fromBlock: blockNumber,
                                toBlock: blockNumber,
                            })];
                    case 2:
                        events = _a.sent();
                        return [4 /*yield*/, async_1.concurrentMap(10, events, function (e) {
                                return _this.getValidator(e.returnValues.validator);
                            })];
                    case 3:
                        validator = _a.sent();
                        return [4 /*yield*/, async_1.concurrentMap(10, events, function (e) {
                                return _this.getValidatorGroup(e.returnValues.group, false);
                            })];
                    case 4:
                        validatorGroup = _a.sent();
                        return [2 /*return*/, events.map(function (e, index) { return ({
                                epochNumber: epochNumber,
                                validator: validator[index],
                                validatorPayment: BaseWrapper_1.valueToBigNumber(e.returnValues.validatorPayment),
                                group: validatorGroup[index],
                                groupPayment: BaseWrapper_1.valueToBigNumber(e.returnValues.groupPayment),
                            }); })];
                }
            });
        });
    };
    /**
     * Returns the current set of validator signer addresses
     */
    ValidatorsWrapper.prototype.currentSignerSet = function () {
        return __awaiter(this, void 0, void 0, function () {
            var n, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = BaseWrapper_1.valueToInt;
                        return [4 /*yield*/, this.contract.methods.numberValidatorsInCurrentSet().call()];
                    case 1:
                        n = _a.apply(void 0, [_b.sent()]);
                        return [2 /*return*/, async_1.concurrentMap(5, Array.from(Array(n).keys()), function (idx) {
                                return _this.contract.methods.validatorSignerAddressFromCurrentSet(idx).call();
                            })];
                }
            });
        });
    };
    /**
     * Returns the current set of validator signer and account addresses
     */
    ValidatorsWrapper.prototype.currentValidatorAccountsSet = function () {
        return __awaiter(this, void 0, void 0, function () {
            var signerAddresses, accountAddresses;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.currentSignerSet()];
                    case 1:
                        signerAddresses = _a.sent();
                        return [4 /*yield*/, async_1.concurrentMap(5, signerAddresses, function (signer) {
                                return _this.validatorSignerToAccount(signer);
                            })];
                    case 2:
                        accountAddresses = _a.sent();
                        return [2 /*return*/, collections_1.zip(function (signer, account) { return ({ signer: signer, account: account }); }, signerAddresses, accountAddresses)];
                }
            });
        });
    };
    /**
     * Returns the group membership for `validator`.
     * @param validator Address of validator to retrieve group membership for.
     * @param blockNumber Block number to retrieve group membership at.
     * @return Group and membership history index for `validator`.
     */
    ValidatorsWrapper.prototype.getValidatorMembershipHistoryIndex = function (validator, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var blockEpoch, _a, _b, _c, account, membershipHistory, historyIndex, group;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = (_a = this.kit).getEpochNumberOfBlock;
                        _c = blockNumber;
                        if (_c) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.kit.web3.eth.getBlockNumber()];
                    case 1:
                        _c = (_d.sent());
                        _d.label = 2;
                    case 2: return [4 /*yield*/, _b.apply(_a, [_c])];
                    case 3:
                        blockEpoch = _d.sent();
                        return [4 /*yield*/, this.validatorSignerToAccount(validator.signer)];
                    case 4:
                        account = _d.sent();
                        return [4 /*yield*/, this.getValidatorMembershipHistory(account)];
                    case 5:
                        membershipHistory = _d.sent();
                        historyIndex = this.findValidatorMembershipHistoryIndex(blockEpoch, membershipHistory);
                        group = membershipHistory[historyIndex].group;
                        return [2 /*return*/, { group: group, historyIndex: historyIndex }];
                }
            });
        });
    };
    /**
     * Returns the index into `history` for `epoch`.
     * @param epoch The needle.
     * @param history The haystack.
     * @return Index for epoch or -1.
     */
    ValidatorsWrapper.prototype.findValidatorMembershipHistoryIndex = function (epoch, history) {
        var revIndex = history
            .slice()
            .reverse()
            .findIndex(function (x) { return x.epoch <= epoch; });
        return revIndex < 0 ? -1 : history.length - revIndex - 1;
    };
    return ValidatorsWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.ValidatorsWrapper = ValidatorsWrapper;
//# sourceMappingURL=Validators.js.map