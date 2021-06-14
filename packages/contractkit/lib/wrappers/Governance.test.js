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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ganache_test_1 = require("@celo/dev-utils/lib/ganache-test");
var async_1 = require("@celo/utils/lib/async");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var __1 = require("..");
var governance_1 = require("../governance");
var kit_1 = require("../kit");
var Governance_1 = require("./Governance");
var expConfig = ganache_test_1.NetworkConfig.governance;
ganache_test_1.testWithGanache('Governance Wrapper', function (web3) {
    var ONE_SEC = 1000;
    var kit = kit_1.newKitFromWeb3(web3);
    var minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether');
    var ONE_CGLD = web3.utils.toWei('1', 'ether');
    var accounts = [];
    var governance;
    var governanceApproverMultiSig;
    var lockedGold;
    var accountWrapper;
    var registry;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, web3.eth.getAccounts()];
                case 1:
                    accounts = _c.sent();
                    kit.defaultAccount = accounts[0];
                    return [4 /*yield*/, kit.contracts.getGovernance()];
                case 2:
                    governance = _c.sent();
                    _b = (_a = kit.contracts).getMultiSig;
                    return [4 /*yield*/, governance.getApprover()];
                case 3: return [4 /*yield*/, _b.apply(_a, [_c.sent()])];
                case 4:
                    governanceApproverMultiSig = _c.sent();
                    return [4 /*yield*/, kit._web3Contracts.getRegistry()];
                case 5:
                    registry = _c.sent();
                    return [4 /*yield*/, kit.contracts.getLockedGold()];
                case 6:
                    lockedGold = _c.sent();
                    return [4 /*yield*/, kit.contracts.getAccounts()];
                case 7:
                    accountWrapper = _c.sent();
                    return [4 /*yield*/, async_1.concurrentMap(4, accounts.slice(0, 4), function (account) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, accountWrapper.createAccount().sendAndWaitForReceipt({ from: account })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, lockedGold.lock().sendAndWaitForReceipt({ from: account, value: ONE_CGLD })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 5 * ONE_SEC);
    var registryRepointProposal = function (repoints) { return __awaiter(void 0, void 0, void 0, function () {
        var builder;
        return __generator(this, function (_a) {
            builder = new governance_1.ProposalBuilder(kit);
            repoints.forEach(function (repoint) {
                var _a;
                return builder.addWeb3Tx((_a = registry.methods).setAddressFor.apply(_a, repoint), {
                    // TODO fix types
                    to: registry._address,
                    value: '0',
                });
            });
            return [2 /*return*/, builder.build()];
        });
    }); };
    // const verifyRepointResult = (repoints: Repoint[]) =>
    //   concurrentMap(4, repoints, async (repoint) => {
    //     const newAddress = await registry.methods.getAddressForStringOrDie(repoint[0]).call()
    //     expect(newAddress).toBe(repoint[1])
    //   })
    it('#getConfig', function () { return __awaiter(void 0, void 0, void 0, function () {
        var config;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, governance.getConfig()];
                case 1:
                    config = _a.sent();
                    expect(config.concurrentProposals).toEqBigNumber(expConfig.concurrentProposals);
                    expect(config.dequeueFrequency).toEqBigNumber(expConfig.dequeueFrequency);
                    expect(config.minDeposit).toEqBigNumber(minDeposit);
                    expect(config.queueExpiry).toEqBigNumber(expConfig.queueExpiry);
                    expect(config.stageDurations.Approval).toEqBigNumber(expConfig.approvalStageDuration);
                    expect(config.stageDurations.Referendum).toEqBigNumber(expConfig.referendumStageDuration);
                    expect(config.stageDurations.Execution).toEqBigNumber(expConfig.executionStageDuration);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('Proposals', function () {
        var repoints = [
            [__1.CeloContract.Random, '0x0000000000000000000000000000000000000001'],
            [__1.CeloContract.Escrow, '0x0000000000000000000000000000000000000002'],
        ];
        var proposalID = new bignumber_js_1.default(1);
        var proposal;
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registryRepointProposal(repoints)];
                case 1: return [2 /*return*/, (proposal = _a.sent())];
            }
        }); }); });
        var proposeFn = function (proposer) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, governance
                        .propose(proposal, 'URL')
                        .sendAndWaitForReceipt({ from: proposer, value: minDeposit })];
            });
        }); };
        var upvoteFn = function (upvoter, shouldTimeTravel) {
            if (shouldTimeTravel === void 0) { shouldTimeTravel = true; }
            return __awaiter(void 0, void 0, void 0, function () {
                var tx;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, governance.upvote(proposalID, upvoter)];
                        case 1:
                            tx = _a.sent();
                            return [4 /*yield*/, tx.sendAndWaitForReceipt({ from: upvoter })];
                        case 2:
                            _a.sent();
                            if (!shouldTimeTravel) return [3 /*break*/, 5];
                            return [4 /*yield*/, ganache_test_1.timeTravel(expConfig.dequeueFrequency, web3)];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, governance.dequeueProposalsIfReady().sendAndWaitForReceipt()];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        // protocol/truffle-config defines approver address as accounts[0]
        var approveFn = function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, multisigTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, governance.approve(proposalID)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, governanceApproverMultiSig.submitOrConfirmTransaction(governance.address, tx.txo)];
                    case 2:
                        multisigTx = _a.sent();
                        return [4 /*yield*/, multisigTx.sendAndWaitForReceipt({ from: accounts[0] })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, ganache_test_1.timeTravel(expConfig.approvalStageDuration, web3)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        var voteFn = function (voter) { return __awaiter(void 0, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, governance.vote(proposalID, 'Yes')];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.sendAndWaitForReceipt({ from: voter })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, ganache_test_1.timeTravel(expConfig.referendumStageDuration, web3)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        it('#propose', function () { return __awaiter(void 0, void 0, void 0, function () {
            var proposalRecord;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, proposeFn(accounts[0])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, governance.getProposalRecord(proposalID)];
                    case 2:
                        proposalRecord = _a.sent();
                        expect(proposalRecord.metadata.proposer).toBe(accounts[0]);
                        expect(proposalRecord.metadata.transactionCount).toBe(proposal.length);
                        expect(proposalRecord.proposal).toStrictEqual(proposal);
                        expect(proposalRecord.stage).toBe('Queued');
                        return [2 /*return*/];
                }
            });
        }); });
        it('#upvote', function () { return __awaiter(void 0, void 0, void 0, function () {
            var voteWeight, upvotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, proposeFn(accounts[0])
                        // shouldTimeTravel is false so getUpvotes isn't on dequeued proposal
                    ];
                    case 1:
                        _a.sent();
                        // shouldTimeTravel is false so getUpvotes isn't on dequeued proposal
                        return [4 /*yield*/, upvoteFn(accounts[1], false)];
                    case 2:
                        // shouldTimeTravel is false so getUpvotes isn't on dequeued proposal
                        _a.sent();
                        return [4 /*yield*/, governance.getVoteWeight(accounts[1])];
                    case 3:
                        voteWeight = _a.sent();
                        return [4 /*yield*/, governance.getUpvotes(proposalID)];
                    case 4:
                        upvotes = _a.sent();
                        expect(upvotes).toEqBigNumber(voteWeight);
                        expect(upvotes).toEqBigNumber(ONE_CGLD);
                        return [2 /*return*/];
                }
            });
        }); });
        it('#revokeUpvote', function () { return __awaiter(void 0, void 0, void 0, function () {
            var before, upvoteRecord, tx, after;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, proposeFn(accounts[0])
                        // shouldTimeTravel is false so revoke isn't on dequeued proposal
                    ];
                    case 1:
                        _a.sent();
                        // shouldTimeTravel is false so revoke isn't on dequeued proposal
                        return [4 /*yield*/, upvoteFn(accounts[1], false)];
                    case 2:
                        // shouldTimeTravel is false so revoke isn't on dequeued proposal
                        _a.sent();
                        return [4 /*yield*/, governance.getUpvotes(proposalID)];
                    case 3:
                        before = _a.sent();
                        return [4 /*yield*/, governance.getUpvoteRecord(accounts[1])];
                    case 4:
                        upvoteRecord = _a.sent();
                        return [4 /*yield*/, governance.revokeUpvote(accounts[1])];
                    case 5:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.sendAndWaitForReceipt({ from: accounts[1] })];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, governance.getUpvotes(proposalID)];
                    case 7:
                        after = _a.sent();
                        expect(after).toEqBigNumber(before.minus(upvoteRecord.upvotes));
                        return [2 /*return*/];
                }
            });
        }); });
        it('#approve', function () { return __awaiter(void 0, void 0, void 0, function () {
            var approved;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, proposeFn(accounts[0])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, upvoteFn(accounts[1])];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, approveFn()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, governance.isApproved(proposalID)];
                    case 4:
                        approved = _a.sent();
                        expect(approved).toBeTruthy();
                        return [2 /*return*/];
                }
            });
        }); });
        it('#vote', function () { return __awaiter(void 0, void 0, void 0, function () {
            var voteWeight, yesVotes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, proposeFn(accounts[0])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, upvoteFn(accounts[1])];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, approveFn()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, voteFn(accounts[2])];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, governance.getVoteWeight(accounts[2])];
                    case 5:
                        voteWeight = _a.sent();
                        return [4 /*yield*/, governance.getVotes(proposalID)];
                    case 6:
                        yesVotes = (_a.sent())[Governance_1.VoteValue.Yes];
                        expect(yesVotes).toEqBigNumber(voteWeight);
                        return [2 /*return*/];
                }
            });
        }); });
        it('#execute', function () { return __awaiter(void 0, void 0, void 0, function () {
            var tx, exists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, proposeFn(accounts[0])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, upvoteFn(accounts[1])];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, approveFn()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, voteFn(accounts[2])];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, governance.execute(proposalID)];
                    case 5:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.sendAndWaitForReceipt()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, governance.proposalExists(proposalID)];
                    case 7:
                        exists = _a.sent();
                        expect(exists).toBeFalsy();
                        return [2 /*return*/];
                }
            });
        }); }, 10 * ONE_SEC);
        it('#getVoter', function () { return __awaiter(void 0, void 0, void 0, function () {
            var proposer, upvoter, expectedUpvoteRecord, voter, expectedVoteRecord;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, proposeFn(accounts[0])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, upvoteFn(accounts[1])];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, approveFn()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, voteFn(accounts[2])];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, governance.getVoter(accounts[0])];
                    case 5:
                        proposer = _a.sent();
                        expect(proposer.refundedDeposits).toEqBigNumber(minDeposit);
                        return [4 /*yield*/, governance.getVoter(accounts[1])];
                    case 6:
                        upvoter = _a.sent();
                        expectedUpvoteRecord = { proposalID: proposalID, upvotes: new bignumber_js_1.default(ONE_CGLD) };
                        expect(upvoter.upvote).toEqual(expectedUpvoteRecord);
                        return [4 /*yield*/, governance.getVoter(accounts[2])];
                    case 7:
                        voter = _a.sent();
                        expectedVoteRecord = { proposalID: proposalID, votes: new bignumber_js_1.default(ONE_CGLD), value: 'Yes' };
                        expect(voter.votes[0]).toEqual(expectedVoteRecord);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // Disabled until validator set precompile is available in ganache
    // https://github.com/celo-org/celo-monorepo/issues/1737
    // describe('Hotfixes', () => {
    //   const repoints: Repoint[] = [
    //     [CeloContract.Random, '0x0000000000000000000000000000000000000003'],
    //     [CeloContract.Escrow, '0x0000000000000000000000000000000000000004'],
    //   ]
    //   let hotfixProposal: Proposal
    //   let hotfixHash: Buffer
    //   beforeAll(async () => {
    //     hotfixProposal = await registryRepointProposal(repoints)
    //     hotfixHash = proposalToHash(kit, hotfixProposal)
    //   })
    //   const whitelistFn = async (whitelister: Address) => {
    //     const tx = governance.whitelistHotfix(proposalToHash(kit, hotfixProposal))
    //     await tx.sendAndWaitForReceipt({ from: whitelister })
    //   }
    //   // validator keys correspond to accounts 6-9
    //   const whitelistQuorumFn = () => concurrentMap(1, accounts.slice(6, 10), whitelistFn)
    //   // protocol/truffle-config defines approver address as accounts[0]
    //   const approveFn = async () => {
    //     const tx = governance.approveHotfix(proposalToHash(kit, hotfixProposal))
    //     await tx.sendAndWaitForReceipt({ from: accounts[0] })
    //   }
    //   const prepareFn = async () => {
    //     const tx = governance.prepareHotfix(hotfixHash)
    //     await tx.sendAndWaitForReceipt()
    //   }
    //   it('#whitelistHotfix', async () => {
    //     await whitelistFn(accounts[9])
    //     const whitelisted = await governance.isHotfixWhitelistedBy(hotfixHash, accounts[9])
    //     expect(whitelisted).toBeTruthy()
    //   })
    //   it('#approveHotfix', async () => {
    //     await approveFn()
    //     const record = await governance.getHotfixRecord(hotfixHash)
    //     expect(record.approved).toBeTruthy()
    //   })
    //   it(
    //     '#prepareHotfix',
    //     async () => {
    //       await whitelistQuorumFn()
    //       await approveFn()
    //       await prepareFn()
    //       const validators = await kit.contracts.getValidators()
    //       const record = await governance.getHotfixRecord(hotfixHash)
    //       expect(record.preparedEpoch).toBe(await validators.getEpochNumber())
    //     },
    //     10 * ONE_SEC
    //   )
    //   it(
    //     '#executeHotfix',
    //     async () => {
    //       await whitelistQuorumFn()
    //       await approveFn()
    //       await prepareFn()
    //       const tx = governance.executeHotfix(hotfixProposal)
    //       await tx.sendAndWaitForReceipt()
    //       const record = await governance.getHotfixRecord(hotfixHash)
    //       expect(record.executed).toBeTruthy()
    //       await verifyRepointResult(repoints)
    //     },
    //     10 * ONE_SEC
    //   )
    // })
});
//# sourceMappingURL=Governance.test.js.map