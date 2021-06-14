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
var kit_1 = require("./kit");
var PromiEventStub_1 = require("./test-utils/PromiEventStub");
function txoStub() {
    var estimateGasMock = jest.fn();
    var peStub = PromiEventStub_1.promiEventSpy();
    var sendMock = jest.fn().mockReturnValue(peStub);
    var pe = {
        arguments: [],
        call: function () {
            throw new Error('not implemented');
        },
        encodeABI: function () {
            throw new Error('not implemented');
        },
        estimateGas: estimateGasMock,
        send: sendMock,
        sendMock: sendMock,
        estimateGasMock: estimateGasMock,
        resolveHash: peStub.resolveHash,
        rejectHash: peStub.rejectHash,
        resolveReceipt: peStub.resolveReceipt,
        rejectReceipt: peStub.resolveReceipt,
    };
    return pe;
}
exports.txoStub = txoStub;
describe('kit.sendTransactionObject()', function () {
    var kit = kit_1.newKit('http://');
    test('should send transaction on simple case', function () { return __awaiter(void 0, void 0, void 0, function () {
        var txo, txRes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    txo = txoStub();
                    txo.estimateGasMock.mockResolvedValue(1000);
                    return [4 /*yield*/, kit.sendTransactionObject(txo)];
                case 1:
                    txRes = _a.sent();
                    txo.resolveHash('HASH');
                    txo.resolveReceipt('Receipt');
                    return [4 /*yield*/, expect(txRes.getHash()).resolves.toBe('HASH')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, expect(txRes.waitReceipt()).resolves.toBe('Receipt')];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should not estimateGas if gas is provided', function () { return __awaiter(void 0, void 0, void 0, function () {
        var txo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    txo = txoStub();
                    return [4 /*yield*/, kit.sendTransactionObject(txo, { gas: 555 })];
                case 1:
                    _a.sent();
                    expect(txo.estimateGasMock).not.toBeCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should use inflation factor on gas', function () { return __awaiter(void 0, void 0, void 0, function () {
        var txo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    txo = txoStub();
                    txo.estimateGasMock.mockResolvedValue(1000);
                    kit.gasInflationFactor = 2;
                    return [4 /*yield*/, kit.sendTransactionObject(txo)];
                case 1:
                    _a.sent();
                    expect(txo.send).toBeCalledWith(expect.objectContaining({
                        gas: 1000 * 2,
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    test('should forward txoptions to txo.send()', function () { return __awaiter(void 0, void 0, void 0, function () {
        var txo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    txo = txoStub();
                    return [4 /*yield*/, kit.sendTransactionObject(txo, { gas: 555, feeCurrency: 'XXX', from: '0xAAFFF' })];
                case 1:
                    _a.sent();
                    expect(txo.send).toBeCalledWith({
                        gasPrice: '0',
                        gas: 555,
                        feeCurrency: 'XXX',
                        from: '0xAAFFF',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=kit.test.js.map