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
var TAG = 'utils/src/async';
/** Sleep for a number of milliseconds */
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
exports.sleep = sleep;
// Retries an async function when it raises an exeption
// if all the tries fail it raises the last thrown exeption
exports.retryAsync = function (inFunction, tries, params, delay, logger) {
    if (delay === void 0) { delay = 100; }
    if (logger === void 0) { logger = null; }
    return __awaiter(void 0, void 0, void 0, function () {
        var saveError, i, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < tries)) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, inFunction.apply(void 0, params)];
                case 3: 
                // it awaits otherwise it'd always do all the retries
                return [2 /*return*/, _a.sent()];
                case 4:
                    error_1 = _a.sent();
                    return [4 /*yield*/, sleep(delay)];
                case 5:
                    _a.sent();
                    saveError = error_1;
                    if (logger) {
                        logger(TAG + "/@retryAsync, Failed to execute function on try #" + i + ":", error_1);
                    }
                    return [3 /*break*/, 6];
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: throw saveError;
            }
        });
    });
};
// Retries an async function when it raises an exeption
// if all the tries fail it raises the last thrown exeption
exports.retryAsyncWithBackOff = function (inFunction, tries, params, delay, factor, logger) {
    if (delay === void 0) { delay = 100; }
    if (factor === void 0) { factor = 1.5; }
    if (logger === void 0) { logger = null; }
    return __awaiter(void 0, void 0, void 0, function () {
        var saveError, i, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < tries)) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, inFunction.apply(void 0, params)];
                case 3: 
                // it awaits otherwise it'd always do all the retries
                return [2 /*return*/, _a.sent()];
                case 4:
                    error_2 = _a.sent();
                    return [4 /*yield*/, sleep(Math.pow(factor, i) * delay)];
                case 5:
                    _a.sent();
                    saveError = error_2;
                    if (logger) {
                        logger(TAG + "/@retryAsync, Failed to execute function on try #" + i, error_2);
                    }
                    return [3 /*break*/, 6];
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: throw saveError;
            }
        });
    });
};
// Retries an async function when it raises an exeption
// if all the tries fail it raises the last thrown exeption
// throws automatically on specified errors
exports.selectiveRetryAsyncWithBackOff = function (inFunction, tries, dontRetry, params, delay, factor, logger) {
    if (delay === void 0) { delay = 100; }
    if (factor === void 0) { factor = 1.5; }
    if (logger === void 0) { logger = null; }
    return __awaiter(void 0, void 0, void 0, function () {
        var saveError, i, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < tries)) return [3 /*break*/, 8];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, inFunction.apply(void 0, params)];
                case 3: 
                // it awaits otherwise it'd always do all the retries
                return [2 /*return*/, _a.sent()];
                case 4:
                    error_3 = _a.sent();
                    if (dontRetry.some(function (msg) { return error_3.message.includes(msg); })) {
                        throw error_3;
                    }
                    saveError = error_3;
                    if (logger) {
                        logger(TAG + "/@retryAsync, Failed to execute function on try #" + i, error_3);
                    }
                    return [3 /*break*/, 5];
                case 5:
                    if (!(i < tries - 1)) return [3 /*break*/, 7];
                    return [4 /*yield*/, sleep(Math.pow(factor, i) * delay)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 1];
                case 8: throw saveError;
            }
        });
    });
};
/**
 * Map an async function over a list xs with a given concurrency level
 *
 * @param concurrency number of `mapFn` concurrent executions
 * @param xs list of value
 * @param mapFn mapping function
 */
function concurrentMap(concurrency, xs, mapFn) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    res = [];
                    _loop_1 = function (i) {
                        var remaining, sliceSize, slice, _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    remaining = xs.length - i;
                                    sliceSize = Math.min(remaining, concurrency);
                                    slice = xs.slice(i, i + sliceSize);
                                    _b = (_a = res).concat;
                                    return [4 /*yield*/, Promise.all(slice.map(function (elem, index) { return mapFn(elem, i + index); }))];
                                case 1:
                                    res = _b.apply(_a, [_c.sent()]);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < xs.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i += concurrency;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, res];
            }
        });
    });
}
exports.concurrentMap = concurrentMap;
/**
 * Map an async function over the values in Object x with a given concurrency level
 *
 * @param concurrency number of `mapFn` concurrent executions
 * @param x associative array of values
 * @param mapFn mapping function
 */
function concurrentValuesMap(concurrency, x, mapFn) {
    return __awaiter(this, void 0, void 0, function () {
        var xk, xv, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    xk = Object.keys(x);
                    xv = [];
                    xk.forEach(function (k) { return xv.push(x[k]); });
                    return [4 /*yield*/, concurrentMap(concurrency, xv, function (val, idx) { return mapFn(val, xk[idx]); })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.reduce(function (output, value, index) {
                            output[xk[index]] = value;
                            return output;
                        }, {})];
            }
        });
    });
}
exports.concurrentValuesMap = concurrentValuesMap;
//# sourceMappingURL=async.js.map