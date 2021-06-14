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
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var web3_1 = __importDefault(require("web3"));
var kit_1 = require("../kit");
/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/
var minLockedGoldValue = web3_1.default.utils.toWei('10000', 'ether'); // 10k gold
var blsPublicKey = '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00';
var blsPoP = '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900';
ganache_test_1.testWithGanache('Validators Wrapper', function (web3) {
    var kit = kit_1.newKitFromWeb3(web3);
    var accounts = [];
    var accountsInstance;
    var validators;
    var lockedGold;
    var registerAccountWithLockedGold = function (account, value) {
        if (value === void 0) { value = minLockedGoldValue; }
        return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, accountsInstance.isAccount(account)];
                    case 1:
                        if (!!(_a.sent())) return [3 /*break*/, 3];
                        return [4 /*yield*/, accountsInstance.createAccount().sendAndWaitForReceipt({ from: account })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, lockedGold.lock().sendAndWaitForReceipt({ from: account, value: value })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3.eth.getAccounts()];
                case 1:
                    accounts = _a.sent();
                    return [4 /*yield*/, kit.contracts.getValidators()];
                case 2:
                    validators = _a.sent();
                    return [4 /*yield*/, kit.contracts.getLockedGold()];
                case 3:
                    lockedGold = _a.sent();
                    return [4 /*yield*/, kit.contracts.getAccounts()];
                case 4:
                    accountsInstance = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var setupGroup = function (groupAccount, members) {
        if (members === void 0) { members = 1; }
        return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, registerAccountWithLockedGold(groupAccount, new bignumber_js_1.default(minLockedGoldValue).times(members).toFixed())];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, validators.registerValidatorGroup(new bignumber_js_1.default(0.1))];
                    case 2: return [4 /*yield*/, (_a.sent()).sendAndWaitForReceipt({
                            from: groupAccount,
                        })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    var setupValidator = function (validatorAccount) { return __awaiter(void 0, void 0, void 0, function () {
        var ecdsaPublicKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registerAccountWithLockedGold(validatorAccount)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, signatureUtils_1.addressToPublicKey(validatorAccount, kit.web3.eth.sign)];
                case 2:
                    ecdsaPublicKey = _a.sent();
                    return [4 /*yield*/, validators
                            // @ts-ignore
                            .registerValidator(ecdsaPublicKey, blsPublicKey, blsPoP)
                            .sendAndWaitForReceipt({
                            from: validatorAccount,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    test('SBAT registerValidatorGroup', function () { return __awaiter(void 0, void 0, void 0, function () {
        var groupAccount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    groupAccount = accounts[0];
                    return [4 /*yield*/, setupGroup(groupAccount)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, expect(validators.isValidatorGroup(groupAccount)).resolves.toBe(true)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('SBAT registerValidator', function () { return __awaiter(void 0, void 0, void 0, function () {
        var validatorAccount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validatorAccount = accounts[1];
                    return [4 /*yield*/, setupValidator(validatorAccount)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, expect(validators.isValidator(validatorAccount)).resolves.toBe(true)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('SBAT addMember', function () { return __awaiter(void 0, void 0, void 0, function () {
        var groupAccount, validatorAccount, members;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    groupAccount = accounts[0];
                    validatorAccount = accounts[1];
                    return [4 /*yield*/, setupGroup(groupAccount)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, setupValidator(validatorAccount)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, validators.affiliate(groupAccount).sendAndWaitForReceipt({ from: validatorAccount })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, validators.addMember(groupAccount, validatorAccount)];
                case 4: return [4 /*yield*/, (_a.sent()).sendAndWaitForReceipt({
                        from: groupAccount,
                    })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, validators.getValidatorGroup(groupAccount).then(function (group) { return group.members; })];
                case 6:
                    members = _a.sent();
                    expect(members).toContain(validatorAccount);
                    return [2 /*return*/];
            }
        });
    }); });
    test('SBAT setNextCommissionUpdate', function () { return __awaiter(void 0, void 0, void 0, function () {
        var groupAccount, commission;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    groupAccount = accounts[0];
                    return [4 /*yield*/, setupGroup(groupAccount)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, validators.setNextCommissionUpdate('0.2').sendAndWaitForReceipt({
                            from: groupAccount,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, validators.getValidatorGroup(groupAccount)];
                case 3:
                    commission = (_a.sent()).nextCommission;
                    expect(commission).toEqBigNumber('0.2');
                    return [2 /*return*/];
            }
        });
    }); });
    test('SBAT updateCommission', function () { return __awaiter(void 0, void 0, void 0, function () {
        var groupAccount, txOpts, commission;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    groupAccount = accounts[0];
                    return [4 /*yield*/, setupGroup(groupAccount)];
                case 1:
                    _a.sent();
                    txOpts = { from: groupAccount };
                    return [4 /*yield*/, validators.setNextCommissionUpdate('0.2').sendAndWaitForReceipt(txOpts)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ganache_test_1.mineBlocks(3, web3)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, validators.updateCommission().sendAndWaitForReceipt(txOpts)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, validators.getValidatorGroup(groupAccount)];
                case 5:
                    commission = (_a.sent()).commission;
                    expect(commission).toEqBigNumber('0.2');
                    return [2 /*return*/];
            }
        });
    }); });
    test('SBAT get group affiliates', function () { return __awaiter(void 0, void 0, void 0, function () {
        var groupAccount, validatorAccount, group;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    groupAccount = accounts[0];
                    validatorAccount = accounts[1];
                    return [4 /*yield*/, setupGroup(groupAccount)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, setupValidator(validatorAccount)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, validators.affiliate(groupAccount).sendAndWaitForReceipt({ from: validatorAccount })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, validators.getValidatorGroup(groupAccount)];
                case 4:
                    group = _a.sent();
                    expect(group.affiliates).toContain(validatorAccount);
                    return [2 /*return*/];
            }
        });
    }); });
    describe('SBAT reorderMember', function () {
        var groupAccount, validator1, validator2;
        beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
            var _i, _a, validator, members;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        groupAccount = accounts[0];
                        return [4 /*yield*/, setupGroup(groupAccount, 2)];
                    case 1:
                        _b.sent();
                        validator1 = accounts[1];
                        validator2 = accounts[2];
                        _i = 0, _a = [validator1, validator2];
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 8];
                        validator = _a[_i];
                        return [4 /*yield*/, setupValidator(validator)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, validators.affiliate(groupAccount).sendAndWaitForReceipt({ from: validator })];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, validators.addMember(groupAccount, validator)];
                    case 5: return [4 /*yield*/, (_b.sent()).sendAndWaitForReceipt({
                            from: groupAccount,
                        })];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [4 /*yield*/, validators
                            .getValidatorGroup(groupAccount)
                            .then(function (group) { return group.members; })];
                    case 9:
                        members = _b.sent();
                        expect(members).toEqual([validator1, validator2]);
                        return [2 /*return*/];
                }
            });
        }); });
        test('move last to first', function () { return __awaiter(void 0, void 0, void 0, function () {
            var membersAfter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jest.setTimeout(30 * 1000);
                        return [4 /*yield*/, validators
                                .reorderMember(groupAccount, validator2, 0)
                                .then(function (x) { return x.sendAndWaitForReceipt({ from: groupAccount }); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, validators
                                .getValidatorGroup(groupAccount)
                                .then(function (group) { return group.members; })];
                    case 2:
                        membersAfter = _a.sent();
                        expect(membersAfter).toEqual([validator2, validator1]);
                        return [2 /*return*/];
                }
            });
        }); });
        test('move first to last', function () { return __awaiter(void 0, void 0, void 0, function () {
            var membersAfter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jest.setTimeout(30 * 1000);
                        return [4 /*yield*/, validators
                                .reorderMember(groupAccount, validator1, 1)
                                .then(function (x) { return x.sendAndWaitForReceipt({ from: groupAccount }); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, validators
                                .getValidatorGroup(groupAccount)
                                .then(function (group) { return group.members; })];
                    case 2:
                        membersAfter = _a.sent();
                        expect(membersAfter).toEqual([validator2, validator1]);
                        return [2 /*return*/];
                }
            });
        }); });
        test('test address normalization', function () { return __awaiter(void 0, void 0, void 0, function () {
            var membersAfter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jest.setTimeout(30 * 1000);
                        return [4 /*yield*/, validators
                                .reorderMember(groupAccount, validator2.toLowerCase(), 0)
                                .then(function (x) { return x.sendAndWaitForReceipt({ from: groupAccount }); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, validators
                                .getValidatorGroup(groupAccount)
                                .then(function (group) { return group.members; })];
                    case 2:
                        membersAfter = _a.sent();
                        expect(membersAfter).toEqual([validator2, validator1]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=Validators.test.js.map