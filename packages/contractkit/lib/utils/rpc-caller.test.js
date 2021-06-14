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
var rpc_caller_1 = require("./rpc-caller");
var mockProvider = {
    host: '',
    connected: true,
    send: function (payload, callback) {
        var response = {
            jsonrpc: payload.jsonrpc,
            id: Number(payload.id),
            result: {
                params: payload.params,
                method: payload.method,
            },
        };
        if (payload.method === 'mock_error_method') {
            callback(new Error(payload.method));
            return;
        }
        else if (payload.method === 'mock_response_error_method') {
            response.error = {
                code: -32000,
                message: 'foobar',
            };
        }
        callback(null, response);
    },
    supportsSubscriptions: function () { return true; },
    disconnect: function () { return true; },
};
describe('RPC Caller class', function () {
    var rpcCaller;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            rpcCaller = new rpc_caller_1.DefaultRpcCaller(mockProvider);
            return [2 /*return*/];
        });
    }); });
    describe('when calling the provider', function () {
        it('populates the payload id', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, rpcCaller.call('mock_method', ['mock_param'])];
                    case 1:
                        result = _a.sent();
                        expect(result.id).not.toBeUndefined();
                        expect(result.id).not.toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
        it('populates the payload jsonrpc', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, rpcCaller.call('mock_method', ['mock_param'])];
                    case 1:
                        result = _a.sent();
                        expect(result.jsonrpc).not.toBeUndefined();
                        expect(result.jsonrpc).toBe('2.0');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('when the provider fails', function () {
        it('raises an error', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(rpcCaller.call('mock_error_method', ['mock_param'])).rejects.toThrowError()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('when the result contains an error', function () {
        it('raises an error with the error message', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expect(rpcCaller.call('mock_response_error_method', ['mock_param'])).rejects.toThrowError('foobar')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
function handleMock(payload) {
    if (payload.method === 'fail_not_promise') {
        throw Error('fail');
    }
    return new Promise(function (resolve, reject) {
        if (payload.method === 'fail_promise') {
            reject(Error('fail promise'));
        }
        else {
            resolve('mock_response');
        }
    });
}
describe('rpcCallHandler function', function () {
    var payload;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            payload = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test',
                params: [],
            };
            return [2 /*return*/];
        });
    }); });
    describe('when the handle promise fails', function () {
        it('the callback receives a response with the error', function (done) {
            function callback(_error, response) {
                try {
                    expect(response.error.code).toBe(-32000);
                    done();
                }
                catch (error) {
                    done(error);
                }
            }
            expect.assertions(1);
            payload.method = 'fail_promise';
            rpc_caller_1.rpcCallHandler(payload, handleMock, callback);
        });
    });
    describe('when the handle fails (not the promise)', function () {
        it('the callback receives a response with the error', function (done) {
            function callback(error, response) {
                try {
                    expect(response).toBeUndefined();
                    expect(error).not.toBeNull();
                    done();
                }
                catch (error) {
                    done(error);
                }
            }
            expect.assertions(2);
            payload.method = 'fail_not_promise';
            rpc_caller_1.rpcCallHandler(payload, handleMock, callback);
        });
    });
    describe('when the handle succeeds', function () {
        it('the callback receives a response with a result', function (done) {
            function callback(_error, response) {
                try {
                    expect(response.error).toBeUndefined();
                    expect(response.result).toBe('mock_response');
                    done();
                }
                catch (error) {
                    done(error);
                }
            }
            expect.assertions(2);
            rpc_caller_1.rpcCallHandler(payload, handleMock, callback);
        });
    });
});
//# sourceMappingURL=rpc-caller.test.js.map