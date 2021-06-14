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
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Contract handling slashing for Validator downtime
 */
var DowntimeSlasherWrapper = /** @class */ (function (_super) {
    __extends(DowntimeSlasherWrapper, _super);
    function DowntimeSlasherWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Returns slashing incentives.
         * @return Rewards and penaltys for slashing.
         */
        _this.slashingIncentives = BaseWrapper_1.proxyCall(_this.contract.methods.slashingIncentives, undefined, function (res) { return ({
            reward: BaseWrapper_1.valueToBigNumber(res.reward),
            penalty: BaseWrapper_1.valueToBigNumber(res.penalty),
        }); });
        /**
         * Returns slashable downtime in blocks.
         * @return The number of consecutive blocks before a Validator missing from IBFT consensus
         * can be slashed.
         */
        _this.slashableDowntime = BaseWrapper_1.proxyCall(_this.contract.methods.slashableDowntime, undefined, BaseWrapper_1.valueToInt);
        /**
         * Tests if a validator has been down.
         * @param startBlock First block of the downtime.
         * @param startSignerIndex Validator index at the first block.
         * @param endSignerIndex Validator index at the last block.
         */
        _this.isDown = BaseWrapper_1.proxyCall(_this.contract.methods.isDown);
        return _this;
    }
    /**
     * Returns current configuration parameters.
     */
    DowntimeSlasherWrapper.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([this.slashableDowntime(), this.slashingIncentives()])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                slashableDowntime: res[0],
                                slashingIncentives: res[1],
                            }];
                }
            });
        });
    };
    /**
     * Tests if the given validator or signer has been down.
     * @param validatorOrSignerAddress Address of the validator account or signer.
     * @param startBlock First block of the downtime, undefined if using endBlock.
     * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
     */
    DowntimeSlasherWrapper.prototype.isValidatorDown = function (validatorOrSignerAddress, startBlock, endBlock) {
        return __awaiter(this, void 0, void 0, function () {
            var window, startSignerIndex, endSignerIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSlashableDowntimeWindow(startBlock, endBlock)];
                    case 1:
                        window = _a.sent();
                        return [4 /*yield*/, this.getValidatorSignerIndex(validatorOrSignerAddress, window.start)];
                    case 2:
                        startSignerIndex = _a.sent();
                        return [4 /*yield*/, this.getValidatorSignerIndex(validatorOrSignerAddress, window.end)];
                    case 3:
                        endSignerIndex = _a.sent();
                        return [2 /*return*/, this.isDown(window.start, startSignerIndex, endSignerIndex)];
                }
            });
        });
    };
    /**
     * Determines the validator signer given an account or signer address and block number.
     * @param validatorOrSignerAddress Address of the validator account or signer.
     * @param blockNumber Block at which to determine the signer index.
     */
    DowntimeSlasherWrapper.prototype.getValidatorSignerIndex = function (validatorOrSignerAddress, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, validators, isAccount, signer, _a, election, index, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 1:
                        accounts = _d.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 2:
                        validators = _d.sent();
                        return [4 /*yield*/, accounts.isAccount(validatorOrSignerAddress)];
                    case 3:
                        isAccount = _d.sent();
                        if (!isAccount) return [3 /*break*/, 5];
                        return [4 /*yield*/, validators.getValidator(validatorOrSignerAddress, blockNumber)];
                    case 4:
                        _a = (_d.sent()).signer;
                        return [3 /*break*/, 6];
                    case 5:
                        _a = validatorOrSignerAddress;
                        _d.label = 6;
                    case 6:
                        signer = _a;
                        return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 7:
                        election = _d.sent();
                        _b = address_1.findAddressIndex;
                        _c = [signer];
                        return [4 /*yield*/, election.getValidatorSigners(blockNumber)];
                    case 8:
                        index = _b.apply(void 0, _c.concat([_d.sent()]));
                        if (index < 0) {
                            throw new Error("Validator signer " + signer + " was not elected at block " + blockNumber);
                        }
                        return [2 /*return*/, index];
                }
            });
        });
    };
    /**
     * Slash a Validator for downtime.
     * @param validator Validator account or signer to slash for downtime.
     * @param startBlock First block of the downtime, undefined if using endBlock.
     * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
     */
    DowntimeSlasherWrapper.prototype.slashValidator = function (validatorOrSignerAddress, startBlock, endBlock) {
        return __awaiter(this, void 0, void 0, function () {
            var window, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getSlashableDowntimeWindow(startBlock, endBlock)];
                    case 1:
                        window = _c.sent();
                        _a = this.slashEndSignerIndex;
                        _b = [window.end];
                        return [4 /*yield*/, this.getValidatorSignerIndex(validatorOrSignerAddress, window.end)];
                    case 2: return [2 /*return*/, _a.apply(this, _b.concat([_c.sent()]))];
                }
            });
        });
    };
    /**
     * Slash a Validator for downtime.
     * @param startBlock First block of the downtime.
     * @param startSignerIndex Validator index at the first block.
     */
    DowntimeSlasherWrapper.prototype.slashStartSignerIndex = function (startBlock, startSignerIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var election, validators, signer, startEpoch, endBlock, _a, endEpoch, endSignerIndex, _b, _c, _d, validator;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 1:
                        election = _e.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 2:
                        validators = _e.sent();
                        return [4 /*yield*/, election.validatorSignerAddressFromSet(startSignerIndex, startBlock)];
                    case 3:
                        signer = _e.sent();
                        return [4 /*yield*/, this.kit.getEpochNumberOfBlock(startBlock)
                            // Follows DowntimeSlasher.getEndBlock()
                        ];
                    case 4:
                        startEpoch = _e.sent();
                        _a = startBlock;
                        return [4 /*yield*/, this.slashableDowntime()];
                    case 5:
                        endBlock = _a + (_e.sent()) - 1;
                        return [4 /*yield*/, this.kit.getEpochNumberOfBlock(endBlock)];
                    case 6:
                        endEpoch = _e.sent();
                        if (!(startEpoch === endEpoch)) return [3 /*break*/, 7];
                        _b = startSignerIndex;
                        return [3 /*break*/, 9];
                    case 7:
                        _c = address_1.findAddressIndex;
                        _d = [signer];
                        return [4 /*yield*/, election.getValidatorSigners(endBlock)];
                    case 8:
                        _b = _c.apply(void 0, _d.concat([_e.sent()]));
                        _e.label = 9;
                    case 9:
                        endSignerIndex = _b;
                        return [4 /*yield*/, validators.getValidatorFromSigner(signer)];
                    case 10:
                        validator = _e.sent();
                        return [2 /*return*/, this.slash(validator, startBlock, startSignerIndex, endSignerIndex)];
                }
            });
        });
    };
    /**
     * Slash a Validator for downtime.
     * @param endBlock The last block of the downtime to slash for.
     * @param endSignerIndex Validator index at the last block.
     */
    DowntimeSlasherWrapper.prototype.slashEndSignerIndex = function (endBlock, endSignerIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var election, validators, signer, endEpoch, startBlock, _a, startEpoch, startSignerIndex, _b, _c, _d, validator;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 1:
                        election = _e.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 2:
                        validators = _e.sent();
                        return [4 /*yield*/, election.validatorSignerAddressFromSet(endSignerIndex, endBlock)];
                    case 3:
                        signer = _e.sent();
                        return [4 /*yield*/, this.kit.getEpochNumberOfBlock(endBlock)
                            // Reverses DowntimeSlasher.getEndBlock()
                        ];
                    case 4:
                        endEpoch = _e.sent();
                        _a = endBlock;
                        return [4 /*yield*/, this.slashableDowntime()];
                    case 5:
                        startBlock = _a - (_e.sent()) + 1;
                        return [4 /*yield*/, this.kit.getEpochNumberOfBlock(startBlock)];
                    case 6:
                        startEpoch = _e.sent();
                        if (!(startEpoch === endEpoch)) return [3 /*break*/, 7];
                        _b = endSignerIndex;
                        return [3 /*break*/, 9];
                    case 7:
                        _c = address_1.findAddressIndex;
                        _d = [signer];
                        return [4 /*yield*/, election.getValidatorSigners(startBlock)];
                    case 8:
                        _b = _c.apply(void 0, _d.concat([_e.sent()]));
                        _e.label = 9;
                    case 9:
                        startSignerIndex = _b;
                        return [4 /*yield*/, validators.getValidatorFromSigner(signer)];
                    case 10:
                        validator = _e.sent();
                        return [2 /*return*/, this.slash(validator, startBlock, startSignerIndex, endSignerIndex)];
                }
            });
        });
    };
    /**
     * Slash a Validator for downtime.
     * @param validator Validator to slash for downtime.
     * @param startBlock First block of the downtime.
     * @param startSignerIndex Validator index at the first block.
     * @param endSignerIndex Validator index at the last block.
     */
    DowntimeSlasherWrapper.prototype.slash = function (validator, startBlock, startSignerIndex, endSignerIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var incentives, validators, membership, lockedGold, slashValidator, slashGroup;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.slashingIncentives()];
                    case 1:
                        incentives = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 2:
                        validators = _a.sent();
                        return [4 /*yield*/, validators.getValidatorMembershipHistoryIndex(validator, startBlock)];
                    case 3:
                        membership = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getLockedGold()];
                    case 4:
                        lockedGold = _a.sent();
                        return [4 /*yield*/, lockedGold.computeInitialParametersForSlashing(validator.address, incentives.penalty)];
                    case 5:
                        slashValidator = _a.sent();
                        return [4 /*yield*/, lockedGold.computeParametersForSlashing(membership.group, incentives.penalty, slashValidator.list)];
                    case 6:
                        slashGroup = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.slash(startBlock, startSignerIndex, endSignerIndex, membership.historyIndex, slashValidator.lessers, slashValidator.greaters, slashValidator.indices, slashGroup.lessers, slashGroup.greaters, slashGroup.indices))];
                }
            });
        });
    };
    /**
     * Calculate the slashable window with respect to a provided start or end block number.
     * @param startBlock First block of the downtime. Determined from endBlock if not provided.
     * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
     */
    DowntimeSlasherWrapper.prototype.getSlashableDowntimeWindow = function (startBlock, endBlock) {
        return __awaiter(this, void 0, void 0, function () {
            var length, latest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.slashableDowntime()];
                    case 1:
                        length = _a.sent();
                        if (startBlock !== undefined && endBlock !== undefined) {
                            if (endBlock - startBlock + 1 !== length) {
                                throw new Error("Start and end block must define a window of " + length + " blocks");
                            }
                            return [2 /*return*/, {
                                    start: startBlock,
                                    end: endBlock,
                                    length: length,
                                }];
                        }
                        if (endBlock !== undefined) {
                            return [2 /*return*/, {
                                    start: endBlock - length + 1,
                                    end: endBlock,
                                    length: length,
                                }];
                        }
                        if (startBlock !== undefined) {
                            return [2 /*return*/, {
                                    start: startBlock,
                                    end: startBlock + length - 1,
                                    length: length,
                                }];
                        }
                        return [4 /*yield*/, this.kit.web3.eth.getBlockNumber()];
                    case 2:
                        latest = (_a.sent()) - 2;
                        return [2 /*return*/, {
                                start: latest - length + 1,
                                end: latest,
                                length: length,
                            }];
                }
            });
        });
    };
    return DowntimeSlasherWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.DowntimeSlasherWrapper = DowntimeSlasherWrapper;
//# sourceMappingURL=DowntimeSlasher.js.map