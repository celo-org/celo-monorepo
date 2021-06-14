"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var tx_params_normalizer_1 = require("./tx-params-normalizer");
describe('TxParamsNormalizer class', function () {
    var populator;
    var mockRpcCall;
    var completeCeloTx = {
        nonce: 1,
        chainId: 1,
        from: 'test',
        to: 'test',
        data: 'test',
        value: 1,
        gas: 1,
        gasPrice: 1,
        feeCurrency: undefined,
        gatewayFeeRecipient: '1',
        gatewayFee: '1',
    };
    beforeEach(function () {
        mockRpcCall = jest.fn(function (_method, _params) {
            return new Promise(function (resolve, _reject) {
                return resolve({
                    jsonrpc: '2.0',
                    id: 1,
                    result: '27',
                });
            });
        });
        var rpcMock = {
            call: mockRpcCall,
            // tslint:disable-next-line: no-empty
            send: function (_payload, _callback) { },
        };
        populator = new tx_params_normalizer_1.TxParamsNormalizer(rpcMock);
    });
    describe('when missing parameters', function () {
        test('will populate the chaindId', function () { return __awaiter(void 0, void 0, void 0, function () {
            var celoTx, newCeloTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        celoTx = __assign({}, completeCeloTx);
                        celoTx.chainId = undefined;
                        return [4 /*yield*/, populator.populate(celoTx)];
                    case 1:
                        newCeloTx = _a.sent();
                        expect(newCeloTx.chainId).toBe(27);
                        expect(mockRpcCall.mock.calls.length).toBe(1);
                        expect(mockRpcCall.mock.calls[0][0]).toBe('net_version');
                        return [2 /*return*/];
                }
            });
        }); });
        test('will retrieve only once the chaindId', function () { return __awaiter(void 0, void 0, void 0, function () {
            var celoTx, newCeloTx, newCeloTx2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        celoTx = __assign({}, completeCeloTx);
                        celoTx.chainId = undefined;
                        return [4 /*yield*/, populator.populate(celoTx)];
                    case 1:
                        newCeloTx = _a.sent();
                        expect(newCeloTx.chainId).toBe(27);
                        return [4 /*yield*/, populator.populate(celoTx)];
                    case 2:
                        newCeloTx2 = _a.sent();
                        expect(newCeloTx2.chainId).toBe(27);
                        expect(mockRpcCall.mock.calls.length).toBe(1);
                        expect(mockRpcCall.mock.calls[0][0]).toBe('net_version');
                        return [2 /*return*/];
                }
            });
        }); });
        test('will populate the nonce', function () { return __awaiter(void 0, void 0, void 0, function () {
            var celoTx, newCeloTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        celoTx = __assign({}, completeCeloTx);
                        celoTx.nonce = undefined;
                        return [4 /*yield*/, populator.populate(celoTx)];
                    case 1:
                        newCeloTx = _a.sent();
                        expect(newCeloTx.nonce).toBe(39); // 0x27 => 39
                        expect(mockRpcCall.mock.calls.length).toBe(1);
                        expect(mockRpcCall.mock.calls[0][0]).toBe('eth_getTransactionCount');
                        return [2 /*return*/];
                }
            });
        }); });
        test('will populate the gas', function () { return __awaiter(void 0, void 0, void 0, function () {
            var celoTx, newCeloTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        celoTx = __assign({}, completeCeloTx);
                        celoTx.gas = undefined;
                        return [4 /*yield*/, populator.populate(celoTx)];
                    case 1:
                        newCeloTx = _a.sent();
                        expect(newCeloTx.gas).toBe('27');
                        expect(mockRpcCall.mock.calls.length).toBe(1);
                        expect(mockRpcCall.mock.calls[0][0]).toBe('eth_estimateGas');
                        return [2 /*return*/];
                }
            });
        }); });
        /* Disabled till the coinbase issue is fixed
    
        test('will populate the gatewayFeeRecipient', async () => {
          const celoTx: Tx = { ...completeCeloTx }
          celoTx.gatewayFeeRecipient = undefined
          const newCeloTx = await populator.populate(celoTx)
          expect(newCeloTx.gatewayFeeRecipient).toBe('27')
          expect(mockRpcCall.mock.calls.length).toBe(1)
          expect(mockRpcCall.mock.calls[0][0]).toBe('eth_coinbase')
        })
    
        test('will retrieve only once the gatewayFeeRecipient', async () => {
          const celoTx: Tx = { ...completeCeloTx }
          celoTx.gatewayFeeRecipient = undefined
          const newCeloTx = await populator.populate(celoTx)
          expect(newCeloTx.gatewayFeeRecipient).toBe('27')
    
          const newCeloTx2 = await populator.populate(celoTx)
          expect(newCeloTx2.gatewayFeeRecipient).toBe('27')
    
          expect(mockRpcCall.mock.calls.length).toBe(1)
          expect(mockRpcCall.mock.calls[0][0]).toBe('eth_coinbase')
        })
        */
        test('will populate the gas price', function () { return __awaiter(void 0, void 0, void 0, function () {
            var celoTx, newCeloTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        celoTx = __assign({}, completeCeloTx);
                        celoTx.gasPrice = undefined;
                        return [4 /*yield*/, populator.populate(celoTx)];
                    case 1:
                        newCeloTx = _a.sent();
                        expect(newCeloTx.gasPrice).toBe('27');
                        expect(mockRpcCall.mock.calls.length).toBe(1);
                        expect(mockRpcCall.mock.calls[0][0]).toBe('eth_gasPrice');
                        return [2 /*return*/];
                }
            });
        }); });
        test('fails (for now) if the fee Currency has something', function () { return __awaiter(void 0, void 0, void 0, function () {
            var celoTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        celoTx = __assign({}, completeCeloTx);
                        celoTx.gasPrice = undefined;
                        celoTx.feeCurrency = 'celoMagic';
                        return [4 /*yield*/, expect(populator.populate(celoTx)).rejects.toThrowError()];
                    case 1:
                        _a.sent();
                        expect(mockRpcCall.mock.calls.length).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=tx-params-normalizer.test.js.map