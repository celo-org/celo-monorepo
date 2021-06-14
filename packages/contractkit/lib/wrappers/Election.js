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
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var lodash_1 = require("lodash");
var base_1 = require("../base");
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Contract for voting for validators and managing validator groups.
 */
var ElectionWrapper = /** @class */ (function (_super) {
    __extends(ElectionWrapper, _super);
    function ElectionWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Returns the current election threshold.
         * @returns Election threshold.
         */
        _this.electabilityThreshold = BaseWrapper_1.proxyCall(_this.contract.methods.getElectabilityThreshold, undefined, BaseWrapper_1.fixidityValueToBigNumber);
        /**
         * Gets a validator address from the validator set at the given block number.
         * @param index Index of requested validator in the validator set.
         * @param blockNumber Block number to retrieve the validator set from.
         * @return Address of validator at the requested index.
         */
        _this.validatorSignerAddressFromSet = BaseWrapper_1.proxyCall(_this.contract.methods.validatorSignerAddressFromSet);
        /**
         * Gets a validator address from the current validator set.
         * @param index Index of requested validator in the validator set.
         * @return Address of validator at the requested index.
         */
        _this.validatorSignerAddressFromCurrentSet = BaseWrapper_1.proxyCall(_this.contract.methods.validatorSignerAddressFromCurrentSet, BaseWrapper_1.tupleParser(BaseWrapper_1.identity));
        /**
         * Gets the size of the validator set that must sign the given block number.
         * @param blockNumber Block number to retrieve the validator set from.
         * @return Size of the validator set.
         */
        _this.numberValidatorsInSet = BaseWrapper_1.proxyCall(_this.contract.methods.numberValidatorsInSet, undefined, BaseWrapper_1.valueToInt);
        /**
         * Gets the size of the current elected validator set.
         * @return Size of the current elected validator set.
         */
        _this.numberValidatorsInCurrentSet = BaseWrapper_1.proxyCall(_this.contract.methods.numberValidatorsInCurrentSet, undefined, BaseWrapper_1.valueToInt);
        /**
         * Returns the total votes received across all groups.
         * @return The total votes received across all groups.
         */
        _this.getTotalVotes = BaseWrapper_1.proxyCall(_this.contract.methods.getTotalVotes, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the current validator signers using the precompiles.
         * @return List of current validator signers.
         */
        _this.getCurrentValidatorSigners = BaseWrapper_1.proxyCall(_this.contract.methods.getCurrentValidatorSigners);
        /**
         * Returns the total votes for `group` made by `account`.
         * @param group The address of the validator group.
         * @param account The address of the voting account.
         * @return The total votes for `group` made by `account`.
         */
        _this.getTotalVotesForGroupByAccount = BaseWrapper_1.proxyCall(_this.contract.methods.getTotalVotesForGroupByAccount, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the groups that `account` has voted for.
         * @param account The address of the account casting votes.
         * @return The groups that `account` has voted for.
         */
        _this.getGroupsVotedForByAccount = BaseWrapper_1.proxyCall(_this.contract.methods.getGroupsVotedForByAccount);
        _this._activate = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.activate);
        return _this;
    }
    /**
     * Returns the minimum and maximum number of validators that can be elected.
     * @returns The minimum and maximum number of validators that can be elected.
     */
    ElectionWrapper.prototype.electableValidators = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, min, max;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.electableValidators().call()];
                    case 1:
                        _a = _b.sent(), min = _a.min, max = _a.max;
                        return [2 /*return*/, { min: BaseWrapper_1.valueToBigNumber(min), max: BaseWrapper_1.valueToBigNumber(max) }];
                }
            });
        });
    };
    /**
     * Returns the validator signers for block `blockNumber`.
     * @param blockNumber Block number to retrieve signers for.
     * @return Address of each signer in the validator set.
     */
    ElectionWrapper.prototype.getValidatorSigners = function (blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var numValidators;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.numberValidatorsInSet(blockNumber)];
                    case 1:
                        numValidators = _a.sent();
                        return [2 /*return*/, async_1.concurrentMap(10, lodash_1.range(0, numValidators, 1), function (i) {
                                return _this.validatorSignerAddressFromSet(i, blockNumber);
                            })];
                }
            });
        });
    };
    /**
     * Returns a list of elected validators with seats allocated to groups via the D'Hondt method.
     * @return The list of elected validators.
     * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
     */
    ElectionWrapper.prototype.electValidatorSigners = function (min, max) {
        return __awaiter(this, void 0, void 0, function () {
            var config, minArg, maxArg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(min !== undefined || max !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getConfig()];
                    case 1:
                        config = _a.sent();
                        minArg = min === undefined ? config.electableValidators.min : min;
                        maxArg = max === undefined ? config.electableValidators.max : max;
                        return [2 /*return*/, this.contract.methods
                                .electNValidatorSigners(minArg.toString(10), maxArg.toString(10))
                                .call()];
                    case 2: return [2 /*return*/, this.contract.methods.electValidatorSigners().call()];
                }
            });
        });
    };
    /**
     * Returns the total votes for `group`.
     * @param group The address of the validator group.
     * @return The total votes for `group`.
     */
    ElectionWrapper.prototype.getTotalVotesForGroup = function (group, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var votes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getTotalVotesForGroup(group).call({}, blockNumber)];
                    case 1:
                        votes = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.valueToBigNumber(votes)];
                }
            });
        });
    };
    /**
     * Returns the active votes for `group`.
     * @param group The address of the validator group.
     * @return The active votes for `group`.
     */
    ElectionWrapper.prototype.getActiveVotesForGroup = function (group, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var votes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getActiveVotesForGroup(group).call({}, blockNumber)];
                    case 1:
                        votes = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.valueToBigNumber(votes)];
                }
            });
        });
    };
    ElectionWrapper.prototype.getVotesForGroupByAccount = function (account, group, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var pending, active;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods
                            .getPendingVotesForGroupByAccount(group, account)
                            // @ts-ignore: Expected 0-1 arguments, but got 2
                            .call({}, blockNumber)];
                    case 1:
                        pending = _a.sent();
                        return [4 /*yield*/, this.contract.methods
                                .getActiveVotesForGroupByAccount(group, account)
                                // @ts-ignore: Expected 0-1 arguments, but got 2
                                .call({}, blockNumber)];
                    case 2:
                        active = _a.sent();
                        return [2 /*return*/, {
                                group: group,
                                pending: BaseWrapper_1.valueToBigNumber(pending),
                                active: BaseWrapper_1.valueToBigNumber(active),
                            }];
                }
            });
        });
    };
    ElectionWrapper.prototype.getVoter = function (account, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var groups, votes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods
                            .getGroupsVotedForByAccount(account)
                            // @ts-ignore: Expected 0-1 arguments, but got 2
                            .call({}, blockNumber)];
                    case 1:
                        groups = _a.sent();
                        return [4 /*yield*/, async_1.concurrentMap(10, groups, function (g) {
                                return _this.getVotesForGroupByAccount(account, g, blockNumber);
                            })];
                    case 2:
                        votes = _a.sent();
                        return [2 /*return*/, { address: account, votes: votes }];
                }
            });
        });
    };
    /**
     * Returns whether or not the account has any pending votes.
     * @param account The address of the account casting votes.
     * @return The groups that `account` has voted for.
     */
    ElectionWrapper.prototype.hasPendingVotes = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var groups, isPending;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getGroupsVotedForByAccount(account).call()];
                    case 1:
                        groups = _a.sent();
                        return [4 /*yield*/, Promise.all(groups.map(function (g) { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = BaseWrapper_1.valueToBigNumber;
                                            return [4 /*yield*/, this.contract.methods.getPendingVotesForGroupByAccount(g, account).call()];
                                        case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()]).isGreaterThan(0)];
                                    }
                                });
                            }); }))];
                    case 2:
                        isPending = _a.sent();
                        return [2 /*return*/, isPending.some(function (a) { return a; })];
                }
            });
        });
    };
    ElectionWrapper.prototype.hasActivatablePendingVotes = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var groups, isActivatable;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getGroupsVotedForByAccount(account).call()];
                    case 1:
                        groups = _a.sent();
                        return [4 /*yield*/, Promise.all(groups.map(function (g) { return _this.contract.methods.hasActivatablePendingVotes(account, g).call(); }))];
                    case 2:
                        isActivatable = _a.sent();
                        return [2 /*return*/, isActivatable.some(function (a) { return a; })];
                }
            });
        });
    };
    /**
     * Returns current configuration parameters.
     */
    ElectionWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.electableValidators(),
                            this.electabilityThreshold(),
                            this.contract.methods.maxNumGroupsVotedFor().call(),
                            this.getTotalVotes(),
                        ])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                electableValidators: res[0],
                                electabilityThreshold: res[1],
                                maxNumGroupsVotedFor: BaseWrapper_1.valueToBigNumber(res[2]),
                                totalVotes: res[3],
                                currentThreshold: res[3].multipliedBy(res[1]),
                            }];
                }
            });
        });
    };
    ElectionWrapper.prototype.getValidatorGroupVotes = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var votes, eligible, numVotesReceivable, accounts, name;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getTotalVotesForGroup(address).call()];
                    case 1:
                        votes = _a.sent();
                        return [4 /*yield*/, this.contract.methods.getGroupEligibility(address).call()];
                    case 2:
                        eligible = _a.sent();
                        return [4 /*yield*/, this.contract.methods.getNumVotesReceivable(address).call()];
                    case 3:
                        numVotesReceivable = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 4:
                        accounts = _a.sent();
                        return [4 /*yield*/, accounts.getName(address)];
                    case 5:
                        name = (_a.sent()) || '';
                        return [2 /*return*/, {
                                address: address,
                                name: name,
                                votes: BaseWrapper_1.valueToBigNumber(votes),
                                capacity: BaseWrapper_1.valueToBigNumber(numVotesReceivable).minus(votes),
                                eligible: eligible,
                            }];
                }
            });
        });
    };
    /**
     * Returns the current registered validator groups and their total votes and eligibility.
     */
    ElectionWrapper.prototype.getValidatorGroupsVotes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var validators, groups;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 1:
                        validators = _a.sent();
                        return [4 /*yield*/, validators.getRegisteredValidatorGroupsAddresses()];
                    case 2:
                        groups = _a.sent();
                        return [2 /*return*/, async_1.concurrentMap(5, groups, function (g) { return _this.getValidatorGroupVotes(g); })];
                }
            });
        });
    };
    /**
     * Activates any activatable pending votes.
     * @param account The account with pending votes to activate.
     */
    ElectionWrapper.prototype.activate = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var groups, isActivatable, groupsActivatable;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getGroupsVotedForByAccount(account).call()];
                    case 1:
                        groups = _a.sent();
                        return [4 /*yield*/, Promise.all(groups.map(function (g) { return _this.contract.methods.hasActivatablePendingVotes(account, g).call(); }))];
                    case 2:
                        isActivatable = _a.sent();
                        groupsActivatable = groups.filter(function (_, i) { return isActivatable[i]; });
                        return [2 /*return*/, groupsActivatable.map(function (g) { return _this._activate(g); })];
                }
            });
        });
    };
    ElectionWrapper.prototype.revokePending = function (account, group, value) {
        return __awaiter(this, void 0, void 0, function () {
            var groups, index, _a, lesser, greater;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getGroupsVotedForByAccount(account).call()];
                    case 1:
                        groups = _b.sent();
                        index = address_1.findAddressIndex(group, groups);
                        return [4 /*yield*/, this.findLesserAndGreaterAfterVote(group, value.times(-1))];
                    case 2:
                        _a = _b.sent(), lesser = _a.lesser, greater = _a.greater;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.revokePending(group, value.toFixed(), lesser, greater, index))];
                }
            });
        });
    };
    ElectionWrapper.prototype.revokeActive = function (account, group, value) {
        return __awaiter(this, void 0, void 0, function () {
            var groups, index, _a, lesser, greater;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getGroupsVotedForByAccount(account).call()];
                    case 1:
                        groups = _b.sent();
                        index = address_1.findAddressIndex(group, groups);
                        return [4 /*yield*/, this.findLesserAndGreaterAfterVote(group, value.times(-1))];
                    case 2:
                        _a = _b.sent(), lesser = _a.lesser, greater = _a.greater;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.revokeActive(group, value.toFixed(), lesser, greater, index))];
                }
            });
        });
    };
    ElectionWrapper.prototype.revoke = function (account, group, value) {
        return __awaiter(this, void 0, void 0, function () {
            var vote, txos, pendingValue, _a, _b, activeValue, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.getVotesForGroupByAccount(account, group)];
                    case 1:
                        vote = _e.sent();
                        if (value.gt(vote.pending.plus(vote.active))) {
                            throw new Error("can't revoke more votes for " + group + " than have been made by " + account);
                        }
                        txos = [];
                        pendingValue = bignumber_js_1.default.minimum(vote.pending, value);
                        if (!!pendingValue.isZero()) return [3 /*break*/, 3];
                        _b = (_a = txos).push;
                        return [4 /*yield*/, this.revokePending(account, group, pendingValue)];
                    case 2:
                        _b.apply(_a, [_e.sent()]);
                        _e.label = 3;
                    case 3:
                        if (!pendingValue.lt(value)) return [3 /*break*/, 5];
                        activeValue = value.minus(pendingValue);
                        _d = (_c = txos).push;
                        return [4 /*yield*/, this.revokeActive(account, group, activeValue)];
                    case 4:
                        _d.apply(_c, [_e.sent()]);
                        _e.label = 5;
                    case 5: return [2 /*return*/, txos];
                }
            });
        });
    };
    /**
     * Increments the number of total and pending votes for `group`.
     * @param validatorGroup The validator group to vote for.
     * @param value The amount of gold to use to vote.
     */
    ElectionWrapper.prototype.vote = function (validatorGroup, value) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, lesser, greater;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.kit.defaultAccount == null) {
                            throw new Error("missing kit.defaultAccount");
                        }
                        return [4 /*yield*/, this.findLesserAndGreaterAfterVote(validatorGroup, value)];
                    case 1:
                        _a = _b.sent(), lesser = _a.lesser, greater = _a.greater;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.vote(validatorGroup, value.toFixed(), lesser, greater))];
                }
            });
        });
    };
    /**
     * Returns the current eligible validator groups and their total votes.
     */
    ElectionWrapper.prototype.getEligibleValidatorGroupsVotes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getTotalVotesForEligibleValidatorGroups().call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, collections_1.zip(function (a, b) { return ({
                                address: a,
                                name: '',
                                votes: new bignumber_js_1.default(b),
                                capacity: new bignumber_js_1.default(0),
                                eligible: true,
                            }); }, res[0], res[1])];
                }
            });
        });
    };
    ElectionWrapper.prototype.findLesserAndGreaterAfterVote = function (votedGroup, voteWeight) {
        return __awaiter(this, void 0, void 0, function () {
            var currentVotes, selectedGroup, voteTotal, greaterKey, lesserKey, _i, currentVotes_1, vote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getEligibleValidatorGroupsVotes()];
                    case 1:
                        currentVotes = _a.sent();
                        selectedGroup = currentVotes.find(function (votes) { return address_1.eqAddress(votes.address, votedGroup); });
                        voteTotal = selectedGroup ? selectedGroup.votes.plus(voteWeight) : voteWeight;
                        greaterKey = base_1.NULL_ADDRESS;
                        lesserKey = base_1.NULL_ADDRESS;
                        // This leverages the fact that the currentVotes are already sorted from
                        // greatest to lowest value
                        for (_i = 0, currentVotes_1 = currentVotes; _i < currentVotes_1.length; _i++) {
                            vote = currentVotes_1[_i];
                            if (!address_1.eqAddress(vote.address, votedGroup)) {
                                if (vote.votes.isLessThanOrEqualTo(voteTotal)) {
                                    lesserKey = vote.address;
                                    break;
                                }
                                greaterKey = vote.address;
                            }
                        }
                        return [2 /*return*/, { lesser: lesserKey, greater: greaterKey }];
                }
            });
        });
    };
    /**
     * Retrieves the set of validatorsparticipating in BFT at epochNumber.
     * @param epochNumber The epoch to retrieve the elected validator set at.
     */
    ElectionWrapper.prototype.getElectedValidators = function (epochNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var blockNumber, signers, validators;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.getFirstBlockNumberForEpoch(epochNumber)];
                    case 1:
                        blockNumber = _a.sent();
                        return [4 /*yield*/, this.getValidatorSigners(blockNumber)];
                    case 2:
                        signers = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 3:
                        validators = _a.sent();
                        return [2 /*return*/, async_1.concurrentMap(10, signers, function (addr) { return validators.getValidatorFromSigner(addr); })];
                }
            });
        });
    };
    /**
     * Retrieves GroupVoterRewards at epochNumber.
     * @param epochNumber The epoch to retrieve GroupVoterRewards at.
     */
    ElectionWrapper.prototype.getGroupVoterRewards = function (epochNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var blockNumber, events, validators, validatorGroup;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.getLastBlockNumberForEpoch(epochNumber)];
                    case 1:
                        blockNumber = _a.sent();
                        return [4 /*yield*/, this.getPastEvents('EpochRewardsDistributedToVoters', {
                                fromBlock: blockNumber,
                                toBlock: blockNumber,
                            })];
                    case 2:
                        events = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 3:
                        validators = _a.sent();
                        return [4 /*yield*/, async_1.concurrentMap(10, events, function (e) {
                                return validators.getValidatorGroup(e.returnValues.group, false);
                            })];
                    case 4:
                        validatorGroup = _a.sent();
                        return [2 /*return*/, events.map(function (e, index) { return ({
                                epochNumber: epochNumber,
                                group: validatorGroup[index],
                                groupVoterPayment: BaseWrapper_1.valueToBigNumber(e.returnValues.value),
                            }); })];
                }
            });
        });
    };
    /**
     * Retrieves VoterRewards for address at epochNumber.
     * @param address The address to retrieve VoterRewards for.
     * @param epochNumber The epoch to retrieve VoterRewards at.
     * @param voterShare Optionally address' share of group rewards.
     */
    ElectionWrapper.prototype.getVoterRewards = function (address, epochNumber, voterShare) {
        return __awaiter(this, void 0, void 0, function () {
            var activeVoteShare, _a, _b, _c, groupVoterRewards, voterRewards;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = voterShare;
                        if (_a) return [3 /*break*/, 3];
                        _b = this.getVoterShare;
                        _c = [address];
                        return [4 /*yield*/, this.kit.getLastBlockNumberForEpoch(epochNumber)];
                    case 1: return [4 /*yield*/, _b.apply(this, _c.concat([_d.sent()]))];
                    case 2:
                        _a = (_d.sent());
                        _d.label = 3;
                    case 3:
                        activeVoteShare = _a;
                        return [4 /*yield*/, this.getGroupVoterRewards(epochNumber)];
                    case 4:
                        groupVoterRewards = _d.sent();
                        voterRewards = groupVoterRewards.filter(function (e) { return address_1.normalizeAddress(e.group.address) in activeVoteShare; });
                        return [2 /*return*/, voterRewards.map(function (e) {
                                var group = address_1.normalizeAddress(e.group.address);
                                return {
                                    address: address,
                                    addressPayment: e.groupVoterPayment.times(activeVoteShare[group]),
                                    group: e.group,
                                    epochNumber: e.epochNumber,
                                };
                            })];
                }
            });
        });
    };
    /**
     * Retrieves a voter's share of active votes.
     * @param address The voter to retrieve share for.
     * @param blockNumber The block to retrieve the voter's share at.
     */
    ElectionWrapper.prototype.getVoterShare = function (address, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var activeVoterVotes, voter, _i, _a, vote, group;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        activeVoterVotes = {};
                        return [4 /*yield*/, this.getVoter(address, blockNumber)];
                    case 1:
                        voter = _b.sent();
                        for (_i = 0, _a = voter.votes; _i < _a.length; _i++) {
                            vote = _a[_i];
                            group = address_1.normalizeAddress(vote.group);
                            activeVoterVotes[group] = vote.active;
                        }
                        return [2 /*return*/, async_1.concurrentValuesMap(10, activeVoterVotes, function (voterVotes, group) { return __awaiter(_this, void 0, void 0, function () { var _a, _b; return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _b = (_a = voterVotes).dividedBy;
                                        return [4 /*yield*/, this.getActiveVotesForGroup(group, blockNumber)];
                                    case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
                                }
                            }); }); })];
                }
            });
        });
    };
    return ElectionWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.ElectionWrapper = ElectionWrapper;
//# sourceMappingURL=Election.js.map