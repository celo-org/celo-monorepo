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
Object.defineProperty(exports, "__esModule", { value: true });
var ganache_test_1 = require("@celo/dev-utils/lib/ganache-test");
var kit_1 = require("../kit");
ganache_test_1.testWithGanache('Validators Wrapper', function (web3) {
    var kit = kit_1.newKitFromWeb3(web3);
    var accounts;
    var lockedGold;
    // Arbitrary value.
    var value = 120938732980;
    var account;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3.eth.getAccounts()];
                case 1:
                    account = (_a.sent())[0];
                    kit.defaultAccount = account;
                    return [4 /*yield*/, kit.contracts.getLockedGold()];
                case 2:
                    lockedGold = _a.sent();
                    return [4 /*yield*/, kit.contracts.getAccounts()];
                case 3:
                    accounts = _a.sent();
                    return [4 /*yield*/, accounts.isAccount(account)];
                case 4:
                    if (!!(_a.sent())) return [3 /*break*/, 6];
                    return [4 /*yield*/, accounts.createAccount().sendAndWaitForReceipt({ from: account })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
    test('SBAT lock gold', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, lockedGold.lock().sendAndWaitForReceipt({ value: value })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('SBAT unlock gold', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, lockedGold.lock().sendAndWaitForReceipt({ value: value })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, lockedGold.unlock(value).sendAndWaitForReceipt()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('SBAT relock gold', function () { return __awaiter(void 0, void 0, void 0, function () {
        var txos;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Make 5 pending withdrawals.
                return [4 /*yield*/, lockedGold.lock().sendAndWaitForReceipt({ value: value * 5 })];
                case 1:
                    // Make 5 pending withdrawals.
                    _a.sent();
                    return [4 /*yield*/, lockedGold.unlock(value).sendAndWaitForReceipt()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, lockedGold.unlock(value).sendAndWaitForReceipt()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, lockedGold.unlock(value).sendAndWaitForReceipt()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, lockedGold.unlock(value).sendAndWaitForReceipt()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, lockedGold.unlock(value).sendAndWaitForReceipt()
                        // Re-lock 2.5 of them
                    ];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, lockedGold.relock(account, value * 2.5)];
                case 7:
                    txos = _a.sent();
                    return [4 /*yield*/, Promise.all(txos.map(function (txo) { return txo.sendAndWaitForReceipt(); }))
                        //
                    ];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=LockedGold.test.js.map