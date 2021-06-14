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
var base_1 = require("../base");
var kit_1 = require("../kit");
var tx_uri_1 = require("./tx-uri");
describe('URI utils', function () {
    var recipient = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    var value = '100';
    var simpleTransferTx = {
        value: value,
        to: recipient,
    };
    var simpleTransferUri = "celo:" + recipient + "?value=" + value;
    var stableTokenTransferUri;
    var stableTokenTransferTx;
    var lockGoldUri;
    var lockGoldTx;
    var kit = kit_1.newKit('http://localhost:8545');
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var stableTokenAddr, stableToken, transferData, lockedGoldAddr, lockedGold, lockData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, kit.registry.addressFor(base_1.CeloContract.StableToken)];
                case 1:
                    stableTokenAddr = _a.sent();
                    stableTokenTransferUri = "celo:" + stableTokenAddr + "/transfer(address,uint256)?args=[" + recipient + "," + value + "]";
                    return [4 /*yield*/, kit.contracts.getStableToken()];
                case 2:
                    stableToken = _a.sent();
                    transferData = stableToken.transfer(recipient, value).txo.encodeABI();
                    stableTokenTransferTx = {
                        to: stableTokenAddr,
                        data: transferData,
                    };
                    return [4 /*yield*/, kit.registry.addressFor(base_1.CeloContract.LockedGold)];
                case 3:
                    lockedGoldAddr = _a.sent();
                    lockGoldUri = "celo:" + lockedGoldAddr + "/lock()?value=" + value;
                    return [4 /*yield*/, kit.contracts.getLockedGold()];
                case 4:
                    lockedGold = _a.sent();
                    lockData = lockedGold.lock().txo.encodeABI();
                    lockGoldTx = {
                        to: lockedGoldAddr,
                        data: lockData,
                        value: value,
                    };
                    return [2 /*return*/];
            }
        });
    }); });
    describe('#parseUri', function () {
        it('should match simple cGLD transfer tx', function () {
            var resultTx = tx_uri_1.parseUri(simpleTransferUri);
            expect(resultTx).toEqual(simpleTransferTx);
        });
        it('should match cUSD transfer tx', function () {
            var resultTx = tx_uri_1.parseUri(stableTokenTransferUri);
            expect(resultTx).toEqual(stableTokenTransferTx);
        });
        it('should match lock gold tx', function () {
            var resultTx = tx_uri_1.parseUri(lockGoldUri);
            expect(resultTx).toEqual(lockGoldTx);
        });
    });
    describe('#buildUri', function () {
        it('should match simple cGLD transfer URI', function () {
            var resultUri = tx_uri_1.buildUri(simpleTransferTx);
            expect(resultUri).toEqual(simpleTransferUri);
        });
        it('should match cUSD transfer URI', function () {
            var uri = tx_uri_1.buildUri(stableTokenTransferTx, 'transfer', ['address', 'uint256']);
            expect(uri).toEqual(stableTokenTransferUri);
        });
        it('should match lock gold URI', function () {
            var uri = tx_uri_1.buildUri(lockGoldTx, 'lock');
            expect(uri).toEqual(lockGoldUri);
        });
    });
});
//# sourceMappingURL=tx-uri.test.js.map