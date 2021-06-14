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
ganache_test_1.testWithGanache('Reserve Wrapper', function (web3) {
    var kit = kit_1.newKitFromWeb3(web3);
    var accounts = [];
    var reserve;
    var reserveSpenderMultiSig;
    var otherReserveAddress;
    var otherSpender;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var spenders, multiSigAddress;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3.eth.getAccounts()];
                case 1:
                    accounts = _a.sent();
                    kit.defaultAccount = accounts[0];
                    otherReserveAddress = accounts[9];
                    otherSpender = accounts[7];
                    return [4 /*yield*/, kit.contracts.getReserve()];
                case 2:
                    reserve = _a.sent();
                    return [4 /*yield*/, reserve.getSpenders()
                        // assumes that the multisig is the most recent spender in the spenders array
                    ];
                case 3:
                    spenders = _a.sent();
                    multiSigAddress = spenders.length > 0 ? spenders[spenders.length - 1] : '';
                    return [4 /*yield*/, kit.contracts.getMultiSig(multiSigAddress)];
                case 4:
                    reserveSpenderMultiSig = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('test is spender', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, reserve.isSpender(reserveSpenderMultiSig.address)];
                case 1:
                    tx = _a.sent();
                    expect(tx).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    test('two spenders required to confirm transfers gold', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tx, multisigTx, events, tx2, multisigTx2, events2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, reserve.transferGold(otherReserveAddress, 10)];
                case 1:
                    tx = _a.sent();
                    return [4 /*yield*/, reserveSpenderMultiSig.submitOrConfirmTransaction(reserve.address, tx.txo)];
                case 2:
                    multisigTx = _a.sent();
                    return [4 /*yield*/, multisigTx.sendAndWaitForReceipt()];
                case 3: return [4 /*yield*/, (_a.sent()).events];
                case 4:
                    events = _a.sent();
                    expect(events && events.Submission && events.Confirmation && !events.Execution);
                    return [4 /*yield*/, reserve.transferGold(otherReserveAddress, 10)];
                case 5:
                    tx2 = _a.sent();
                    return [4 /*yield*/, reserveSpenderMultiSig.submitOrConfirmTransaction(reserve.address, tx2.txo)];
                case 6:
                    multisigTx2 = _a.sent();
                    return [4 /*yield*/, multisigTx2.sendAndWaitForReceipt({ from: otherSpender })];
                case 7: return [4 /*yield*/, (_a.sent()).events];
                case 8:
                    events2 = _a.sent();
                    expect(events2 && !events2.Submission && events2.Confirmation && events2.Execution);
                    return [2 /*return*/];
            }
        });
    }); });
    test('test does not transfer gold if not spender', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tx, multisigTx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, reserve.transferGold(otherReserveAddress, 10)];
                case 1:
                    tx = _a.sent();
                    return [4 /*yield*/, reserveSpenderMultiSig.submitOrConfirmTransaction(reserve.address, tx.txo)];
                case 2:
                    multisigTx = _a.sent();
                    return [4 /*yield*/, expect(multisigTx.sendAndWaitForReceipt({ from: accounts[2] })).rejects.toThrowError()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=Reserve.test.js.map