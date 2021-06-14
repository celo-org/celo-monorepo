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
 * Contract handling slashing for Validator double-signing
 */
var DoubleSigningSlasherWrapper = /** @class */ (function (_super) {
    __extends(DoubleSigningSlasherWrapper, _super);
    function DoubleSigningSlasherWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Returns slashing incentives.
         * @return Rewards and penaltys for slashing.
         */
        _this.slashingIncentives = BaseWrapper_1.proxyCall(_this.contract.methods.slashingIncentives, undefined, function (res) { return ({
            reward: BaseWrapper_1.valueToBigNumber(res.reward),
            penalty: BaseWrapper_1.valueToBigNumber(res.penalty),
        }); });
        return _this;
    }
    /**
     * Parses block number out of header.
     * @param header RLP encoded header
     * @return Block number.
     */
    DoubleSigningSlasherWrapper.prototype.getBlockNumberFromHeader = function (header) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.getBlockNumberFromHeader(header).call()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.valueToInt(res)];
                }
            });
        });
    };
    /**
     * Slash a Validator for double-signing.
     * @param validator Validator to slash.
     * @param headerA First double signed block header.
     * @param headerB Second double signed block header.
     */
    DoubleSigningSlasherWrapper.prototype.slashValidator = function (validatorAddress, headerA, headerB) {
        return __awaiter(this, void 0, void 0, function () {
            var election, validators, validator, blockNumber, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 1:
                        election = _d.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 2:
                        validators = _d.sent();
                        return [4 /*yield*/, validators.getValidator(validatorAddress)];
                    case 3:
                        validator = _d.sent();
                        return [4 /*yield*/, this.getBlockNumberFromHeader(headerA)];
                    case 4:
                        blockNumber = _d.sent();
                        _a = this.slash;
                        _b = address_1.findAddressIndex;
                        _c = [validator.signer];
                        return [4 /*yield*/, election.getValidatorSigners(blockNumber)];
                    case 5: return [2 /*return*/, _a.apply(this, [_b.apply(void 0, _c.concat([_d.sent()])),
                            headerA,
                            headerB])];
                }
            });
        });
    };
    /**
     * Slash a Validator for double-signing.
     * @param validator Validator to slash.
     * @param headerA First double signed block header.
     * @param headerB Second double signed block header.
     */
    DoubleSigningSlasherWrapper.prototype.slashSigner = function (signerAddress, headerA, headerB) {
        return __awaiter(this, void 0, void 0, function () {
            var election, blockNumber, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 1:
                        election = _d.sent();
                        return [4 /*yield*/, this.getBlockNumberFromHeader(headerA)];
                    case 2:
                        blockNumber = _d.sent();
                        _a = this.slash;
                        _b = address_1.findAddressIndex;
                        _c = [signerAddress];
                        return [4 /*yield*/, election.getValidatorSigners(blockNumber)];
                    case 3: return [2 /*return*/, _a.apply(this, [_b.apply(void 0, _c.concat([_d.sent()])),
                            headerA,
                            headerB])];
                }
            });
        });
    };
    /**
     * Slash a Validator for double-signing.
     * @param signerIndex Validator index at the block.
     * @param headerA First double signed block header.
     * @param headerB Second double signed block header.
     */
    DoubleSigningSlasherWrapper.prototype.slash = function (signerIndex, headerA, headerB) {
        return __awaiter(this, void 0, void 0, function () {
            var incentives, blockNumber, election, validators, signer, validator, membership, lockedGold, slashValidator, slashGroup;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.slashingIncentives()];
                    case 1:
                        incentives = _a.sent();
                        return [4 /*yield*/, this.getBlockNumberFromHeader(headerA)];
                    case 2:
                        blockNumber = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getElection()];
                    case 3:
                        election = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getValidators()];
                    case 4:
                        validators = _a.sent();
                        return [4 /*yield*/, election.validatorSignerAddressFromSet(signerIndex, blockNumber)];
                    case 5:
                        signer = _a.sent();
                        return [4 /*yield*/, validators.getValidatorFromSigner(signer)];
                    case 6:
                        validator = _a.sent();
                        return [4 /*yield*/, validators.getValidatorMembershipHistoryIndex(validator, blockNumber)];
                    case 7:
                        membership = _a.sent();
                        return [4 /*yield*/, this.kit.contracts.getLockedGold()];
                    case 8:
                        lockedGold = _a.sent();
                        return [4 /*yield*/, lockedGold.computeInitialParametersForSlashing(validator.address, incentives.penalty)];
                    case 9:
                        slashValidator = _a.sent();
                        return [4 /*yield*/, lockedGold.computeParametersForSlashing(membership.group, incentives.penalty, slashValidator.list)];
                    case 10:
                        slashGroup = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.slash(signer, signerIndex, headerA, headerB, membership.historyIndex, slashValidator.lessers, slashValidator.greaters, slashValidator.indices, slashGroup.lessers, slashGroup.greaters, slashGroup.indices))];
                }
            });
        });
    };
    return DoubleSigningSlasherWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.DoubleSigningSlasherWrapper = DoubleSigningSlasherWrapper;
//# sourceMappingURL=DoubleSigningSlasher.js.map