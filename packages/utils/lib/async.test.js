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
var async_1 = require("./async");
describe('retryAsync()', function () {
    test('tries once if it works', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFunction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFunction = jest.fn();
                    return [4 /*yield*/, async_1.retryAsync(mockFunction, 3, [], 1)];
                case 1:
                    _a.sent();
                    expect(mockFunction).toHaveBeenCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('retries n times', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFunction, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFunction = jest.fn(function () {
                        throw new Error('error');
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, async_1.retryAsync(mockFunction, 3, [], 1)];
                case 2:
                    _a.sent();
                    expect(false).toBeTruthy();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4:
                    expect(mockFunction).toHaveBeenCalledTimes(3);
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('selectiveRetryAsyncWithBackOff()', function () {
    test('tries only once if error is in dontRetry array', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFunction, didThrowError, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockFunction = jest.fn();
                    mockFunction.mockImplementation(function () {
                        throw new Error('test');
                    });
                    didThrowError = false;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, async_1.selectiveRetryAsyncWithBackOff(mockFunction, 3, ['test'], [])];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    didThrowError = true;
                    return [3 /*break*/, 4];
                case 4:
                    expect(mockFunction).toHaveBeenCalledTimes(1);
                    expect(didThrowError).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
});
var counter = function () {
    var value = 0;
    return {
        val: function () {
            return value;
        },
        inc: function (x) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, async_1.sleep(5)];
                        case 1:
                            _a.sent();
                            value++;
                            return [2 /*return*/, x * x];
                    }
                });
            });
        },
    };
};
describe('concurrentMap()', function () {
    it('should be equivalent to Promise.all(xs.map())', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fn, xs, expected, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fn = function (x) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, x * x];
                    }); }); };
                    xs = [1, 3, 4, 5, 6, 23, 90];
                    return [4 /*yield*/, Promise.all(xs.map(fn))];
                case 1:
                    expected = _a.sent();
                    return [4 /*yield*/, async_1.concurrentMap(3, xs, fn)];
                case 2:
                    result = _a.sent();
                    expect(result).toEqual(expected);
                    return [2 /*return*/];
            }
        });
    }); });
    // TODO this test is flaky, disabling for now
    it.skip('should respect the concurrency level', function () { return __awaiter(void 0, void 0, void 0, function () {
        var c1, c2, xs, p1, p2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    c1 = counter();
                    c2 = counter();
                    xs = [1, 3, 4, 5, 6, 23, 90];
                    p1 = Promise.all(xs.map(c1.inc));
                    p2 = async_1.concurrentMap(2, xs, c2.inc);
                    // sleep enough for Promise.all to finish
                    return [4 /*yield*/, async_1.sleep(7)];
                case 1:
                    // sleep enough for Promise.all to finish
                    _a.sent();
                    expect(c1.val()).toEqual(xs.length);
                    expect(c1.val()).not.toEqual(c2.val());
                    return [4 /*yield*/, async_1.sleep(20)];
                case 2:
                    _a.sent();
                    expect(c1.val()).toEqual(c2.val());
                    return [4 /*yield*/, p1];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, p2];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should allow concurrency level > than length', function () { return __awaiter(void 0, void 0, void 0, function () {
        var c, xs, p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    c = counter();
                    xs = [1, 3, 4];
                    p = async_1.concurrentMap(5, xs, c.inc);
                    return [4 /*yield*/, async_1.sleep(7)];
                case 1:
                    _a.sent();
                    expect(c.val()).toEqual(xs.length);
                    return [4 /*yield*/, p];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=async.test.js.map