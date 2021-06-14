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
var BaseWrapper_1 = require("./BaseWrapper");
var ProposalStage;
(function (ProposalStage) {
    ProposalStage["None"] = "None";
    ProposalStage["Queued"] = "Queued";
    ProposalStage["Approval"] = "Approval";
    ProposalStage["Referendum"] = "Referendum";
    ProposalStage["Execution"] = "Execution";
    ProposalStage["Expiration"] = "Expiration";
})(ProposalStage = exports.ProposalStage || (exports.ProposalStage = {}));
exports.proposalToParams = function (proposal, descriptionURL) {
    var data = proposal.map(function (tx) { return address_1.hexToBuffer(tx.input); });
    return [
        proposal.map(function (tx) { return tx.value; }),
        proposal.map(function (tx) { return tx.to; }),
        BaseWrapper_1.bufferToSolidityBytes(Buffer.concat(data)),
        data.map(function (inp) { return inp.length; }),
        descriptionURL,
    ];
};
var VoteValue;
(function (VoteValue) {
    VoteValue["None"] = "NONE";
    VoteValue["Abstain"] = "Abstain";
    VoteValue["No"] = "No";
    VoteValue["Yes"] = "Yes";
})(VoteValue = exports.VoteValue || (exports.VoteValue = {}));
exports.hotfixToParams = function (proposal, salt) {
    var p = exports.proposalToParams(proposal, ''); // no description URL for hotfixes
    return [p[0], p[1], p[2], p[3], address_1.bufferToHex(salt)];
};
var ZERO_BN = new bignumber_js_1.default(0);
/**
 * Contract managing voting for governance proposals.
 */
var GovernanceWrapper = /** @class */ (function (_super) {
    __extends(GovernanceWrapper, _super);
    function GovernanceWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Querying number of possible concurrent proposals.
         * @returns Current number of possible concurrent proposals.
         */
        _this.concurrentProposals = BaseWrapper_1.proxyCall(_this.contract.methods.concurrentProposals, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Query proposal dequeue frequency.
         * @returns Current proposal dequeue frequency in seconds.
         */
        _this.lastDequeue = BaseWrapper_1.proxyCall(_this.contract.methods.lastDequeue, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Query proposal dequeue frequency.
         * @returns Current proposal dequeue frequency in seconds.
         */
        _this.dequeueFrequency = BaseWrapper_1.proxyCall(_this.contract.methods.dequeueFrequency, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Query minimum deposit required to make a proposal.
         * @returns Current minimum deposit.
         */
        _this.minDeposit = BaseWrapper_1.proxyCall(_this.contract.methods.minDeposit, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Query queue expiry parameter.
         * @return The number of seconds a proposal can stay in the queue before expiring.
         */
        _this.queueExpiry = BaseWrapper_1.proxyCall(_this.contract.methods.queueExpiry, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns whether or not a particular account is voting on proposals.
         * @param account The address of the account.
         * @returns Whether or not the account is voting on proposals.
         */
        _this.isVoting = BaseWrapper_1.proxyCall(_this.contract.methods.isVoting);
        /**
         * Returns the metadata associated with a given proposal.
         * @param proposalID Governance proposal UUID
         */
        _this.getProposalMetadata = BaseWrapper_1.proxyCall(_this.contract.methods.getProposal, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString), function (res) { return ({
            proposer: res[0],
            deposit: BaseWrapper_1.valueToBigNumber(res[1]),
            timestamp: BaseWrapper_1.valueToBigNumber(res[2]),
            transactionCount: BaseWrapper_1.valueToInt(res[3]),
            descriptionURL: res[4],
        }); });
        /**
         * Returns the transaction at the given index associated with a given proposal.
         * @param proposalID Governance proposal UUID
         * @param txIndex Transaction index
         */
        _this.getProposalTransaction = BaseWrapper_1.proxyCall(_this.contract.methods.getProposalTransaction, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString, BaseWrapper_1.valueToString), function (res) { return ({
            value: res[0],
            to: res[1],
            input: BaseWrapper_1.solidityBytesToString(res[2]),
        }); });
        /**
         * Returns whether a given proposal is approved.
         * @param proposalID Governance proposal UUID
         */
        _this.isApproved = BaseWrapper_1.proxyCall(_this.contract.methods.isApproved, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Returns whether a dequeued proposal is expired.
         * @param proposalID Governance proposal UUID
         */
        _this.isDequeuedProposalExpired = BaseWrapper_1.proxyCall(_this.contract.methods.isDequeuedProposalExpired, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Returns whether a dequeued proposal is expired.
         * @param proposalID Governance proposal UUID
         */
        _this.isQueuedProposalExpired = BaseWrapper_1.proxyCall(_this.contract.methods.isQueuedProposalExpired, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Returns the approver address for proposals and hotfixes.
         */
        _this.getApprover = BaseWrapper_1.proxyCall(_this.contract.methods.approver);
        _this.getProposalStage = BaseWrapper_1.proxyCall(_this.contract.methods.getProposalStage, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString), function (res) { return Object.keys(ProposalStage)[BaseWrapper_1.valueToInt(res)]; });
        /**
         * Returns whether a given proposal is passing relative to the constitution's threshold.
         * @param proposalID Governance proposal UUID
         */
        _this.isProposalPassing = BaseWrapper_1.proxyCall(_this.contract.methods.isProposalPassing, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Withdraws refunded proposal deposits.
         */
        _this.withdraw = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.withdraw);
        /**
         * Submits a new governance proposal.
         * @param proposal Governance proposal
         * @param descriptionURL A URL where further information about the proposal can be viewed
         */
        _this.propose = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.propose, exports.proposalToParams);
        /**
         * Returns whether a governance proposal exists with the given ID.
         * @param proposalID Governance proposal UUID
         */
        _this.proposalExists = BaseWrapper_1.proxyCall(_this.contract.methods.proposalExists, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Returns the current upvoted governance proposal ID and applied vote weight (zeroes if none).
         * @param upvoter Address of upvoter
         */
        _this.getUpvoteRecord = BaseWrapper_1.proxyCall(_this.contract.methods.getUpvoteRecord, BaseWrapper_1.tupleParser(BaseWrapper_1.identity), function (o) { return ({
            proposalID: BaseWrapper_1.valueToBigNumber(o[0]),
            upvotes: BaseWrapper_1.valueToBigNumber(o[1]),
        }); });
        /**
         * Returns whether a given proposal is queued.
         * @param proposalID Governance proposal UUID
         */
        _this.isQueued = BaseWrapper_1.proxyCall(_this.contract.methods.isQueued, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString));
        /**
         * Returns the value of proposal deposits that have been refunded.
         * @param proposer Governance proposer address.
         */
        _this.getRefundedDeposits = BaseWrapper_1.proxyCall(_this.contract.methods.refundedDeposits, BaseWrapper_1.tupleParser(BaseWrapper_1.stringIdentity), BaseWrapper_1.valueToBigNumber);
        /*
         * Returns the upvotes applied to a given proposal.
         * @param proposalID Governance proposal UUID
         */
        _this.getUpvotes = BaseWrapper_1.proxyCall(_this.contract.methods.getUpvotes, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString), BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the yes, no, and abstain votes applied to a given proposal.
         * @param proposalID Governance proposal UUID
         */
        _this.getVotes = BaseWrapper_1.proxyCall(_this.contract.methods.getVoteTotals, BaseWrapper_1.tupleParser(BaseWrapper_1.valueToString), function (res) {
            var _a;
            return (_a = {},
                _a[VoteValue.Yes] = BaseWrapper_1.valueToBigNumber(res[0]),
                _a[VoteValue.No] = BaseWrapper_1.valueToBigNumber(res[1]),
                _a[VoteValue.Abstain] = BaseWrapper_1.valueToBigNumber(res[2]),
                _a);
        });
        /**
         * Returns the proposal queue as list of upvote records.
         */
        _this.getQueue = BaseWrapper_1.proxyCall(_this.contract.methods.getQueue, undefined, function (arraysObject) {
            return collections_1.zip(function (_id, _upvotes) { return ({
                proposalID: BaseWrapper_1.valueToBigNumber(_id),
                upvotes: BaseWrapper_1.valueToBigNumber(_upvotes),
            }); }, arraysObject[0], arraysObject[1]);
        });
        /**
         * Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue
         */
        _this.dequeueProposalsIfReady = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.dequeueProposalsIfReady);
        /**
         * Returns whether a given hotfix has been whitelisted by a given address.
         * @param hash keccak256 hash of hotfix's associated abi encoded transactions
         * @param whitelister address of whitelister
         */
        _this.isHotfixWhitelistedBy = BaseWrapper_1.proxyCall(_this.contract.methods.isHotfixWhitelistedBy, BaseWrapper_1.tupleParser(address_1.bufferToHex, function (s) { return BaseWrapper_1.identity(s); }));
        /**
         * Returns whether a given hotfix can be passed.
         * @param hash keccak256 hash of hotfix's associated abi encoded transactions
         */
        _this.isHotfixPassing = BaseWrapper_1.proxyCall(_this.contract.methods.isHotfixPassing, BaseWrapper_1.tupleParser(address_1.bufferToHex));
        /**
         * Returns the number of validators required to reach a Byzantine quorum
         */
        _this.minQuorumSize = BaseWrapper_1.proxyCall(_this.contract.methods.minQuorumSizeInCurrentSet, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the number of validators that whitelisted the hotfix
         * @param hash keccak256 hash of hotfix's associated abi encoded transactions
         */
        _this.hotfixWhitelistValidatorTally = BaseWrapper_1.proxyCall(_this.contract.methods.hotfixWhitelistValidatorTally, BaseWrapper_1.tupleParser(address_1.bufferToHex));
        /**
         * Marks the given hotfix whitelisted by `sender`.
         * @param hash keccak256 hash of hotfix's associated abi encoded transactions
         */
        _this.whitelistHotfix = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.whitelistHotfix, BaseWrapper_1.tupleParser(address_1.bufferToHex));
        /**
         * Marks the given hotfix approved by `sender`.
         * @param hash keccak256 hash of hotfix's associated abi encoded transactions
         * @notice Only the `approver` address will succeed in sending this transaction
         */
        _this.approveHotfix = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.approveHotfix, BaseWrapper_1.tupleParser(address_1.bufferToHex));
        /**
         * Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.
         * @param hash keccak256 hash of hotfix's associated abi encoded transactions
         */
        _this.prepareHotfix = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.prepareHotfix, BaseWrapper_1.tupleParser(address_1.bufferToHex));
        /**
         * Executes a given sequence of transactions if the corresponding hash is prepared and approved.
         * @param hotfix Governance hotfix proposal
         * @param salt Secret which guarantees uniqueness of hash
         * @notice keccak256 hash of abi encoded transactions computed on-chain
         */
        _this.executeHotfix = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.executeHotfix, exports.hotfixToParams);
        return _this;
    }
    /**
     * Query durations of different stages in proposal lifecycle.
     * @returns Durations for approval, referendum and execution stages in seconds.
     */
    GovernanceWrapper.prototype.stageDurations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.stageDurations().call()];
                    case 1:
                        res = _b.sent();
                        return [2 /*return*/, (_a = {},
                                _a[ProposalStage.Approval] = BaseWrapper_1.valueToBigNumber(res[0]),
                                _a[ProposalStage.Referendum] = BaseWrapper_1.valueToBigNumber(res[1]),
                                _a[ProposalStage.Execution] = BaseWrapper_1.valueToBigNumber(res[2]),
                                _a)];
                }
            });
        });
    };
    /**
     * Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal transaction.
     * @param tx Transaction to determine the constitution for running.
     */
    GovernanceWrapper.prototype.getTransactionConstitution = function (tx) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var callSignature, value;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        callSignature = address_1.ensureLeading0x(address_1.trimLeading0x(tx.input).slice(0, 8));
                        return [4 /*yield*/, this.contract.methods
                                .getConstitution((_a = tx.to) !== null && _a !== void 0 ? _a : address_1.NULL_ADDRESS, callSignature)
                                .call()];
                    case 1:
                        value = _b.sent();
                        return [2 /*return*/, fixidity_1.fromFixed(new bignumber_js_1.default(value))];
                }
            });
        });
    };
    /**
     * Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal.
     * @param proposal Proposal to determine the constitution for running.
     */
    GovernanceWrapper.prototype.getConstitution = function (proposal) {
        return __awaiter(this, void 0, void 0, function () {
            var constitution, _i, proposal_1, tx, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        constitution = new bignumber_js_1.default(0);
                        _i = 0, proposal_1 = proposal;
                        _c.label = 1;
                    case 1:
                        if (!(_i < proposal_1.length)) return [3 /*break*/, 4];
                        tx = proposal_1[_i];
                        _b = (_a = bignumber_js_1.default).max;
                        return [4 /*yield*/, this.getTransactionConstitution(tx)];
                    case 2:
                        constitution = _b.apply(_a, [_c.sent(), constitution]);
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, constitution];
                }
            });
        });
    };
    /**
     * Returns the participation parameters.
     * @returns The participation parameters.
     */
    GovernanceWrapper.prototype.getParticipationParameters = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getParticipationParameters().call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                baseline: fixidity_1.fromFixed(new bignumber_js_1.default(res[0])),
                                baselineFloor: fixidity_1.fromFixed(new bignumber_js_1.default(res[1])),
                                baselineUpdateFactor: fixidity_1.fromFixed(new bignumber_js_1.default(res[2])),
                                baselineQuorumFactor: fixidity_1.fromFixed(new bignumber_js_1.default(res[3])),
                            }];
                }
            });
        });
    };
    /**
     * Returns current configuration parameters.
     */
    GovernanceWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.concurrentProposals(),
                            this.dequeueFrequency(),
                            this.minDeposit(),
                            this.queueExpiry(),
                            this.stageDurations(),
                            this.getParticipationParameters(),
                        ])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                concurrentProposals: res[0],
                                dequeueFrequency: res[1],
                                minDeposit: res[2],
                                queueExpiry: res[3],
                                stageDurations: res[4],
                                participationParameters: res[5],
                            }];
                }
            });
        });
    };
    GovernanceWrapper.prototype.timeUntilStages = function (proposalID) {
        return __awaiter(this, void 0, void 0, function () {
            var meta, now, durations, referendum, execution, expiration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getProposalMetadata(proposalID)];
                    case 1:
                        meta = _a.sent();
                        now = Math.round(new Date().getTime() / 1000);
                        return [4 /*yield*/, this.stageDurations()];
                    case 2:
                        durations = _a.sent();
                        referendum = meta.timestamp.plus(durations.Approval).minus(now);
                        execution = referendum.plus(durations.Referendum);
                        expiration = execution.plus(durations.Execution);
                        return [2 /*return*/, { referendum: referendum, execution: execution, expiration: expiration }];
                }
            });
        });
    };
    /**
     * Returns the proposal associated with a given id.
     * @param proposalID Governance proposal UUID
     */
    GovernanceWrapper.prototype.getProposal = function (proposalID) {
        return __awaiter(this, void 0, void 0, function () {
            var metadata, txIndices;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getProposalMetadata(proposalID)];
                    case 1:
                        metadata = _a.sent();
                        txIndices = Array.from(Array(metadata.transactionCount).keys());
                        return [2 /*return*/, async_1.concurrentMap(4, txIndices, function (idx) { return _this.getProposalTransaction(proposalID, idx); })];
                }
            });
        });
    };
    /**
     * Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.
     * @param proposalID Governance proposal UUID
     */
    GovernanceWrapper.prototype.getProposalRecord = function (proposalID) {
        return __awaiter(this, void 0, void 0, function () {
            var metadata, proposal, stage, passing, upvotes, votes;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getProposalMetadata(proposalID)];
                    case 1:
                        metadata = _b.sent();
                        return [4 /*yield*/, this.getProposal(proposalID)];
                    case 2:
                        proposal = _b.sent();
                        return [4 /*yield*/, this.getProposalStage(proposalID)];
                    case 3:
                        stage = _b.sent();
                        return [4 /*yield*/, this.isProposalPassing(proposalID)];
                    case 4:
                        passing = _b.sent();
                        upvotes = ZERO_BN;
                        votes = (_a = {}, _a[VoteValue.Yes] = ZERO_BN, _a[VoteValue.No] = ZERO_BN, _a[VoteValue.Abstain] = ZERO_BN, _a);
                        if (!(stage === ProposalStage.Queued)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.getUpvotes(proposalID)];
                    case 5:
                        upvotes = _b.sent();
                        return [3 /*break*/, 8];
                    case 6:
                        if (!(stage !== ProposalStage.Expiration)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.getVotes(proposalID)];
                    case 7:
                        votes = _b.sent();
                        _b.label = 8;
                    case 8: return [2 /*return*/, {
                            proposal: proposal,
                            metadata: metadata,
                            stage: stage,
                            upvotes: upvotes,
                            votes: votes,
                            passing: passing,
                        }];
                }
            });
        });
    };
    /**
     * Returns the corresponding vote record
     * @param voter Address of voter
     * @param proposalID Governance proposal UUID
     */
    GovernanceWrapper.prototype.getVoteRecord = function (voter, proposalID) {
        return __awaiter(this, void 0, void 0, function () {
            var proposalIndex, res, _1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getDequeueIndex(proposalID)];
                    case 1:
                        proposalIndex = _a.sent();
                        return [4 /*yield*/, this.contract.methods.getVoteRecord(voter, proposalIndex).call()];
                    case 2:
                        res = _a.sent();
                        return [2 /*return*/, {
                                proposalID: BaseWrapper_1.valueToBigNumber(res[0]),
                                value: Object.keys(VoteValue)[BaseWrapper_1.valueToInt(res[1])],
                                votes: BaseWrapper_1.valueToBigNumber(res[2]),
                            }];
                    case 3:
                        _1 = _a.sent();
                        // The proposal ID may not be present in the dequeued list, or the voter may not have a vote
                        // record for the proposal.
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the (existing) proposal dequeue as list of proposal IDs.
     */
    GovernanceWrapper.prototype.getDequeue = function (filterZeroes) {
        if (filterZeroes === void 0) { filterZeroes = false; }
        return __awaiter(this, void 0, void 0, function () {
            var dequeue, dequeueIds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getDequeue().call()
                        // filter non-zero as dequeued indices are reused and `deleteDequeuedProposal` zeroes
                    ];
                    case 1:
                        dequeue = _a.sent();
                        dequeueIds = dequeue.map(BaseWrapper_1.valueToBigNumber);
                        return [2 /*return*/, filterZeroes ? dequeueIds.filter(function (id) { return !id.isZero(); }) : dequeueIds];
                }
            });
        });
    };
    /*
     * Returns the vote records for a given voter.
     */
    GovernanceWrapper.prototype.getVoteRecords = function (voter) {
        return __awaiter(this, void 0, void 0, function () {
            var dequeue, voteRecords;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDequeue()];
                    case 1:
                        dequeue = _a.sent();
                        return [4 /*yield*/, Promise.all(dequeue.map(function (id) { return _this.getVoteRecord(voter, id); }))];
                    case 2:
                        voteRecords = _a.sent();
                        return [2 /*return*/, voteRecords.filter(function (record) { return record != null; })];
                }
            });
        });
    };
    /*
     * Returns information pertaining to a voter in governance.
     */
    GovernanceWrapper.prototype.getVoter = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.getUpvoteRecord(account),
                            this.getVoteRecords(account),
                            this.getRefundedDeposits(account),
                        ])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                upvote: res[0],
                                votes: res[1],
                                refundedDeposits: res[2],
                            }];
                }
            });
        });
    };
    /**
     * Returns the number of votes that will be applied to a proposal for a given voter.
     * @param voter Address of voter
     */
    GovernanceWrapper.prototype.getVoteWeight = function (voter) {
        return __awaiter(this, void 0, void 0, function () {
            var lockedGoldContract;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getLockedGold()];
                    case 1:
                        lockedGoldContract = _a.sent();
                        return [2 /*return*/, lockedGoldContract.getAccountTotalLockedGold(voter)];
                }
            });
        });
    };
    GovernanceWrapper.prototype.getIndex = function (id, array) {
        var index = array.findIndex(function (bn) { return bn.isEqualTo(id); });
        if (index === -1) {
            throw new Error("ID " + id + " not found in array " + array);
        }
        return index;
    };
    GovernanceWrapper.prototype.getDequeueIndex = function (proposalID, dequeue) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!dequeue) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getDequeue()];
                    case 1:
                        dequeue = _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.getIndex(proposalID, dequeue)];
                }
            });
        });
    };
    GovernanceWrapper.prototype.getQueueIndex = function (proposalID, queue) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!queue) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getQueue()];
                    case 1:
                        queue = _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, {
                            index: this.getIndex(proposalID, queue.map(function (record) { return record.proposalID; })),
                            queue: queue,
                        }];
                }
            });
        });
    };
    GovernanceWrapper.prototype.lesserAndGreater = function (proposalID, _queue) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, index, queue;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getQueueIndex(proposalID, _queue)];
                    case 1:
                        _a = _b.sent(), index = _a.index, queue = _a.queue;
                        return [2 /*return*/, {
                                lesserID: index === 0 ? ZERO_BN : queue[index - 1].proposalID,
                                greaterID: index === queue.length - 1 ? ZERO_BN : queue[index + 1].proposalID,
                            }];
                }
            });
        });
    };
    GovernanceWrapper.prototype.sortedQueue = function (queue) {
        return queue.sort(function (a, b) { return a.upvotes.comparedTo(b.upvotes); });
    };
    GovernanceWrapper.prototype.withUpvoteRevoked = function (upvoter, _queue) {
        return __awaiter(this, void 0, void 0, function () {
            var upvoteRecord, _a, index, queue;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getUpvoteRecord(upvoter)];
                    case 1:
                        upvoteRecord = _b.sent();
                        return [4 /*yield*/, this.getQueueIndex(upvoteRecord.proposalID, _queue)];
                    case 2:
                        _a = _b.sent(), index = _a.index, queue = _a.queue;
                        queue[index].upvotes = queue[index].upvotes.minus(upvoteRecord.upvotes);
                        return [2 /*return*/, {
                                queue: this.sortedQueue(queue),
                                upvoteRecord: upvoteRecord,
                            }];
                }
            });
        });
    };
    GovernanceWrapper.prototype.withUpvoteApplied = function (upvoter, proposalID, _queue) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, index, queue, weight;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getQueueIndex(proposalID, _queue)];
                    case 1:
                        _a = _b.sent(), index = _a.index, queue = _a.queue;
                        return [4 /*yield*/, this.getVoteWeight(upvoter)];
                    case 2:
                        weight = _b.sent();
                        queue[index].upvotes = queue[index].upvotes.plus(weight);
                        return [2 /*return*/, this.sortedQueue(queue)];
                }
            });
        });
    };
    GovernanceWrapper.prototype.lesserAndGreaterAfterRevoke = function (upvoter) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, queue, upvoteRecord;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.withUpvoteRevoked(upvoter)];
                    case 1:
                        _a = _b.sent(), queue = _a.queue, upvoteRecord = _a.upvoteRecord;
                        return [2 /*return*/, this.lesserAndGreater(upvoteRecord.proposalID, queue)];
                }
            });
        });
    };
    GovernanceWrapper.prototype.lesserAndGreaterAfterUpvote = function (upvoter, proposalID) {
        return __awaiter(this, void 0, void 0, function () {
            var upvoteRecord, recordQueued, queue, _a, upvoteQueue;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getUpvoteRecord(upvoter)];
                    case 1:
                        upvoteRecord = _b.sent();
                        return [4 /*yield*/, this.isQueued(upvoteRecord.proposalID)
                            // if existing upvote exists in queue, revoke it before applying new upvote
                        ];
                    case 2:
                        recordQueued = _b.sent();
                        if (!recordQueued) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.withUpvoteRevoked(upvoter)];
                    case 3:
                        _a = (_b.sent()).queue;
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.getQueue()];
                    case 5:
                        _a = _b.sent();
                        _b.label = 6;
                    case 6:
                        queue = _a;
                        return [4 /*yield*/, this.withUpvoteApplied(upvoter, proposalID, queue)];
                    case 7:
                        upvoteQueue = _b.sent();
                        return [2 /*return*/, this.lesserAndGreater(proposalID, upvoteQueue)];
                }
            });
        });
    };
    /**
     * Applies provided upvoter's upvote to given proposal.
     * @param proposalID Governance proposal UUID
     * @param upvoter Address of upvoter
     */
    GovernanceWrapper.prototype.upvote = function (proposalID, upvoter) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, lesserID, greaterID;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.lesserAndGreaterAfterUpvote(upvoter, proposalID)];
                    case 1:
                        _a = _b.sent(), lesserID = _a.lesserID, greaterID = _a.greaterID;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.upvote(BaseWrapper_1.valueToString(proposalID), BaseWrapper_1.valueToString(lesserID), BaseWrapper_1.valueToString(greaterID)))];
                }
            });
        });
    };
    /**
     * Revokes provided upvoter's upvote.
     * @param upvoter Address of upvoter
     */
    GovernanceWrapper.prototype.revokeUpvote = function (upvoter) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, lesserID, greaterID;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.lesserAndGreaterAfterRevoke(upvoter)];
                    case 1:
                        _a = _b.sent(), lesserID = _a.lesserID, greaterID = _a.greaterID;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.revokeUpvote(BaseWrapper_1.valueToString(lesserID), BaseWrapper_1.valueToString(greaterID)))];
                }
            });
        });
    };
    /**
     * Approves given proposal, allowing it to later move to `referendum`.
     * @param proposalID Governance proposal UUID
     * @notice Only the `approver` address will succeed in sending this transaction
     */
    GovernanceWrapper.prototype.approve = function (proposalID) {
        return __awaiter(this, void 0, void 0, function () {
            var proposalIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDequeueIndex(proposalID)];
                    case 1:
                        proposalIndex = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.approve(BaseWrapper_1.valueToString(proposalID), proposalIndex))];
                }
            });
        });
    };
    /**
     * Applies `sender`'s vote choice to a given proposal.
     * @param proposalID Governance proposal UUID
     * @param vote Choice to apply (yes, no, abstain)
     */
    GovernanceWrapper.prototype.vote = function (proposalID, vote) {
        return __awaiter(this, void 0, void 0, function () {
            var proposalIndex, voteNum;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDequeueIndex(proposalID)];
                    case 1:
                        proposalIndex = _a.sent();
                        voteNum = Object.keys(VoteValue).indexOf(vote);
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.vote(BaseWrapper_1.valueToString(proposalID), proposalIndex, voteNum))];
                }
            });
        });
    };
    /**
     * Returns `voter`'s vote choice on a given proposal.
     * @param proposalID Governance proposal UUID
     * @param voter Address of voter
     */
    GovernanceWrapper.prototype.getVoteValue = function (proposalID, voter) {
        return __awaiter(this, void 0, void 0, function () {
            var proposalIndex, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDequeueIndex(proposalID)];
                    case 1:
                        proposalIndex = _a.sent();
                        return [4 /*yield*/, this.contract.methods.getVoteRecord(voter, proposalIndex).call()];
                    case 2:
                        res = _a.sent();
                        return [2 /*return*/, Object.keys(VoteValue)[BaseWrapper_1.valueToInt(res[1])]];
                }
            });
        });
    };
    /**
     * Executes a given proposal's associated transactions.
     * @param proposalID Governance proposal UUID
     */
    GovernanceWrapper.prototype.execute = function (proposalID) {
        return __awaiter(this, void 0, void 0, function () {
            var proposalIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDequeueIndex(proposalID)];
                    case 1:
                        proposalIndex = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.execute(BaseWrapper_1.valueToString(proposalID), proposalIndex))];
                }
            });
        });
    };
    /**
     * Returns approved, executed, and prepared status associated with a given hotfix.
     * @param hash keccak256 hash of hotfix's associated abi encoded transactions
     */
    GovernanceWrapper.prototype.getHotfixRecord = function (hash) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getHotfixRecord(address_1.bufferToHex(hash)).call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                approved: res[0],
                                executed: res[1],
                                preparedEpoch: BaseWrapper_1.valueToBigNumber(res[2]),
                            }];
                }
            });
        });
    };
    return GovernanceWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.GovernanceWrapper = GovernanceWrapper;
//# sourceMappingURL=Governance.js.map