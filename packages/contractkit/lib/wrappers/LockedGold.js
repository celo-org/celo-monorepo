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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var collections_1 = require("@celo/utils/lib/collections");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var BaseWrapper_1 = require("../wrappers/BaseWrapper");
/**
 * Contract for handling deposits needed for voting.
 */
var LockedGoldWrapper = /** @class */ (function (_super) {
    __extends(LockedGoldWrapper, _super);
    function LockedGoldWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Withdraws a gold that has been unlocked after the unlocking period has passed.
         * @param index The index of the pending withdrawal to withdraw.
         */
        _this.withdraw = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.withdraw);
        /**
         * Locks gold to be used for voting.
         * The gold to be locked, must be specified as the `tx.value`
         */
        _this.lock = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.lock);
        /**
         * Unlocks gold that becomes withdrawable after the unlocking period.
         * @param value The amount of gold to unlock.
         */
        _this.unlock = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.unlock, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Relocks gold that has been unlocked but not withdrawn.
         * @param index The index of the pending withdrawal to relock from.
         * @param value The value to relock from the specified pending withdrawal.
         */
        _this._relock = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.relock, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString, BaseWrapper_1.valueToString));
        /**
         * Returns the total amount of locked gold for an account.
         * @param account The account.
         * @return The total amount of locked gold for an account.
         */
        _this.getAccountTotalLockedGold = BaseWrapper_1.proxyCall(_this.contract.methods.getAccountTotalLockedGold, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the total amount of locked gold in the system. Note that this does not include
         *   gold that has been unlocked but not yet withdrawn.
         * @returns The total amount of locked gold in the system.
         */
        _this.getTotalLockedGold = BaseWrapper_1.proxyCall(_this.contract.methods.getTotalLockedGold, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the total amount of non-voting locked gold for an account.
         * @param account The account.
         * @return The total amount of non-voting locked gold for an account.
         */
        _this.getAccountNonvotingLockedGold = BaseWrapper_1.proxyCall(_this.contract.methods.getAccountNonvotingLockedGold, undefined, BaseWrapper_1.valueToBigNumber);
        return _this;
    }
    LockedGoldWrapper.prototype.getPendingWithdrawalsTotalValue = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var pendingWithdrawals, values, reducer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPendingWithdrawals(account)
                        // Ensure there are enough pending withdrawals to relock.
                    ];
                    case 1:
                        pendingWithdrawals = _a.sent();
                        values = pendingWithdrawals.map(function (pw) { return pw.value; });
                        reducer = function (total, pw) { return pw.plus(total); };
                        return [2 /*return*/, values.reduce(reducer, new bignumber_js_1.default(0))];
                }
            });
        });
    };
    /**
     * Relocks gold that has been unlocked but not withdrawn.
     * @param value The value to relock from pending withdrawals.
     */
    LockedGoldWrapper.prototype.relock = function (account, value) {
        return __awaiter(this, void 0, void 0, function () {
            var pendingWithdrawals, totalValue, throwIfNotSorted, remainingToRelock, relockPw;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPendingWithdrawals(account)
                        // Ensure there are enough pending withdrawals to relock.
                    ];
                    case 1:
                        pendingWithdrawals = _a.sent();
                        return [4 /*yield*/, this.getPendingWithdrawalsTotalValue(account)];
                    case 2:
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
                                acc.push(_this._relock(i, valueToRelock));
                            }
                            return acc;
                        };
                        return [2 /*return*/, pendingWithdrawals.reduceRight(relockPw, [])];
                }
            });
        });
    };
    /**
     * Returns current configuration parameters.
     */
    LockedGoldWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = {};
                        _b = BaseWrapper_1.valueToBigNumber;
                        return [4 /*yield*/, this.contract.methods.unlockingPeriod().call()];
                    case 1:
                        _a.unlockingPeriod = _b.apply(void 0, [_c.sent()]);
                        return [4 /*yield*/, this.getTotalLockedGold()];
                    case 2: return [2 /*return*/, (_a.totalLockedGold = _c.sent(),
                            _a)];
                }
            });
        });
    };
    LockedGoldWrapper.prototype.getAccountSummary = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var nonvoting, total, validators, requirement, pendingWithdrawals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAccountNonvotingLockedGold(account)];
                    case 1:
                        nonvoting = _a.sent();
                        return [4 /*yield*/, this.getAccountTotalLockedGold(account)];
                    case 2:
                        total = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 3:
                        validators = _a.sent();
                        return [4 /*yield*/, validators.getAccountLockedGoldRequirement(account)];
                    case 4:
                        requirement = _a.sent();
                        return [4 /*yield*/, this.getPendingWithdrawals(account)];
                    case 5:
                        pendingWithdrawals = _a.sent();
                        return [2 /*return*/, {
                                lockedGold: {
                                    total: total,
                                    nonvoting: nonvoting,
                                    requirement: requirement,
                                },
                                pendingWithdrawals: pendingWithdrawals,
                            }];
                }
            });
        });
    };
    /**
     * Returns the pending withdrawals from unlocked gold for an account.
     * @param account The address of the account.
     * @return The value and timestamp for each pending withdrawal.
     */
    LockedGoldWrapper.prototype.getPendingWithdrawals = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var withdrawals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getPendingWithdrawals(account).call()];
                    case 1:
                        withdrawals = _a.sent();
                        return [2 /*return*/, collections_1.zip(function (time, value) { return ({
                                time: BaseWrapper_1.valueToBigNumber(time),
                                value: BaseWrapper_1.valueToBigNumber(value),
                            }); }, withdrawals[1], withdrawals[0])];
                }
            });
        });
    };
    /**
     * Retrieves AccountSlashed for epochNumber.
     * @param epochNumber The epoch to retrieve AccountSlashed at.
     */
    LockedGoldWrapper.prototype.getAccountsSlashed = function (epochNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var events, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = this.getPastEvents;
                        _b = ['AccountSlashed'];
                        _c = {};
                        return [4 /*yield*/, this.kit.getFirstBlockNumberForEpoch(epochNumber)];
                    case 1:
                        _c.fromBlock = _d.sent();
                        return [4 /*yield*/, this.kit.getLastBlockNumberForEpoch(epochNumber)];
                    case 2: return [4 /*yield*/, _a.apply(this, _b.concat([(_c.toBlock = _d.sent(),
                                _c)]))];
                    case 3:
                        events = _d.sent();
                        return [2 /*return*/, events.map(function (e) { return ({
                                epochNumber: epochNumber,
                                slashed: e.returnValues.slashed,
                                penalty: BaseWrapper_1.valueToBigNumber(e.returnValues.penalty),
                                reporter: e.returnValues.reporter,
                                reward: BaseWrapper_1.valueToBigNumber(e.returnValues.reward),
                            }); })];
                }
            });
        });
    };
    /**
     * Computes parameters for slashing `penalty` from `account`.
     * @param account The account to slash.
     * @param penalty The amount to slash as penalty.
     * @return List of (group, voting gold) to decrement from `account`.
     */
    LockedGoldWrapper.prototype.computeInitialParametersForSlashing = function (account, penalty) {
        return __awaiter(this, void 0, void 0, function () {
            var election, eligible, groups;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 1:
                        election = _a.sent();
                        return [4 /*yield*/, election.getEligibleValidatorGroupsVotes()];
                    case 2:
                        eligible = _a.sent();
                        groups = eligible.map(function (x) { return ({ address: x.address, value: x.votes }); });
                        return [2 /*return*/, this.computeParametersForSlashing(account, penalty, groups)];
                }
            });
        });
    };
    LockedGoldWrapper.prototype.computeParametersForSlashing = function (account, penalty, groups) {
        return __awaiter(this, void 0, void 0, function () {
            var changed, changes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.computeDecrementsForSlashing(account, penalty, groups)];
                    case 1:
                        changed = _a.sent();
                        changes = collections_1.linkedListChanges(groups, changed);
                        return [2 /*return*/, __assign(__assign({}, changes), { indices: changed.map(function (a) { return a.index; }) })];
                }
            });
        });
    };
    // Returns how much voting gold will be decremented from the groups voted by an account
    // Implementation follows protocol/test/common/integration slashingOfGroups()
    LockedGoldWrapper.prototype.computeDecrementsForSlashing = function (account, penalty, allGroups) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var nonVoting, difference, election, groups, res, _loop_1, i, state_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAccountNonvotingLockedGold(account)];
                    case 1:
                        nonVoting = _b.sent();
                        if (penalty.isLessThan(nonVoting)) {
                            return [2 /*return*/, []];
                        }
                        difference = penalty.minus(nonVoting);
                        return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 2:
                        election = _b.sent();
                        return [4 /*yield*/, election.getGroupsVotedForByAccount(account)];
                    case 3:
                        groups = _b.sent();
                        res = [];
                        _loop_1 = function (i) {
                            var group, totalVotes, votes, slashedVotes;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        group = groups[i];
                                        totalVotes = (_a = allGroups.find(function (a) { return a.address === group; })) === null || _a === void 0 ? void 0 : _a.value;
                                        if (!totalVotes) {
                                            throw new Error("Cannot find group " + group);
                                        }
                                        return [4 /*yield*/, election.getTotalVotesForGroupByAccount(group, account)];
                                    case 1:
                                        votes = _a.sent();
                                        slashedVotes = votes.lt(difference) ? votes : difference;
                                        res.push({ address: group, value: totalVotes.minus(slashedVotes), index: i });
                                        difference = difference.minus(slashedVotes);
                                        if (difference.eq(new bignumber_js_1.default(0))) {
                                            return [2 /*return*/, "break"];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        i = groups.length - 1;
                        _b.label = 4;
                    case 4:
                        if (!(i >= 0)) return [3 /*break*/, 7];
                        return [5 /*yield**/, _loop_1(i)];
                    case 5:
                        state_1 = _b.sent();
                        if (state_1 === "break")
                            return [3 /*break*/, 7];
                        _b.label = 6;
                    case 6:
                        i--;
                        return [3 /*break*/, 4];
                    case 7: return [2 /*return*/, res];
                }
            });
        });
    };
    return LockedGoldWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.LockedGoldWrapper = LockedGoldWrapper;
//# sourceMappingURL=LockedGold.js.map