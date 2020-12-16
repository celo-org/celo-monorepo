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
var task_1 = require("./task");
describe('repeatTask()', function () {
    test("should repeat task until it't stopped", function () { return __awaiter(void 0, void 0, void 0, function () {
        var fn, task, currentCalls;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fn = jest.fn().mockResolvedValue(null);
                    task = task_1.repeatTask({
                        name: 'testTask',
                        timeInBetweenMS: 10,
                    }, fn);
                    return [4 /*yield*/, async_1.sleep(15)];
                case 1:
                    _a.sent();
                    currentCalls = fn.mock.calls.length;
                    task.stop();
                    return [4 /*yield*/, async_1.sleep(10)];
                case 2:
                    _a.sent();
                    expect(task.isRunning()).toBeFalsy();
                    expect(fn).toBeCalledTimes(currentCalls);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should keep repeating even if task fails', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fn, task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fn = jest.fn().mockRejectedValue(new Error('Failed'));
                    task = task_1.repeatTask({
                        name: 'testTask',
                        timeInBetweenMS: 10,
                    }, fn);
                    return [4 /*yield*/, async_1.sleep(35)];
                case 1:
                    _a.sent();
                    expect(fn.mock.calls.length).toBeGreaterThan(1);
                    task.stop();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should set and increment execution number', function () { return __awaiter(void 0, void 0, void 0, function () {
        var executionsNumbers, fn, task, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    executionsNumbers = [];
                    fn = jest.fn(function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            executionsNumbers.push(ctx.executionNumber);
                            return [2 /*return*/];
                        });
                    }); });
                    task = task_1.repeatTask({
                        name: 'testTask',
                        timeInBetweenMS: 10,
                    }, fn);
                    return [4 /*yield*/, async_1.sleep(35)];
                case 1:
                    _a.sent();
                    task.stop();
                    for (i = 0; i < executionsNumbers.length; i++) {
                        expect(executionsNumbers[i]).toBe(i + 1);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    test('should call logger with taskName prefix', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fn, logger, _i, _a, call;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    fn = function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            ctx.stopTask();
                            throw new Error('MESSAGE');
                        });
                    }); };
                    logger = jest.fn();
                    task_1.repeatTask({
                        name: 'testTask',
                        timeInBetweenMS: 10,
                        logger: logger,
                    }, fn);
                    return [4 /*yield*/, async_1.sleep(5)];
                case 1:
                    _b.sent();
                    expect(logger.mock.calls.length).toBeGreaterThan(0);
                    for (_i = 0, _a = logger.mock.calls; _i < _a.length; _i++) {
                        call = _a[_i];
                        expect(call[0]).toBe('testTask:: ');
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    test('should be able to stop repetitions from ctx', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fn, task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fn = jest.fn(function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (ctx.executionNumber === 2) {
                                ctx.stopTask();
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    task = task_1.repeatTask({
                        name: 'testTask',
                        timeInBetweenMS: 10,
                    }, fn);
                    return [4 /*yield*/, async_1.sleep(25)];
                case 1:
                    _a.sent();
                    expect(task.isRunning()).toBeFalsy();
                    expect(fn).toBeCalledTimes(2);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should use initialDelayMS', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fn, task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fn = jest.fn().mockResolvedValue(null);
                    task = task_1.repeatTask({
                        name: 'testTask',
                        initialDelayMS: 10,
                        timeInBetweenMS: 10,
                    }, fn);
                    return [4 /*yield*/, async_1.sleep(2)];
                case 1:
                    _a.sent();
                    expect(fn).toHaveBeenCalledTimes(0);
                    return [4 /*yield*/, async_1.sleep(10)];
                case 2:
                    _a.sent();
                    expect(fn).toHaveBeenCalledTimes(1);
                    task.stop();
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('conditionWatcher()', function () {
    test('will execute onSuccess when condition triggers', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pollCondition, onSuccess, task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pollCondition = jest
                        .fn()
                        .mockResolvedValueOnce(false)
                        .mockResolvedValueOnce(true);
                    onSuccess = jest.fn();
                    task = task_1.conditionWatcher({
                        name: 'testCondition',
                        onSuccess: onSuccess,
                        pollCondition: pollCondition,
                        timeInBetweenMS: 10,
                    });
                    return [4 /*yield*/, async_1.sleep(25)];
                case 1:
                    _a.sent();
                    expect(task.isRunning()).toBeFalsy();
                    expect(onSuccess).toHaveBeenCalled();
                    expect(pollCondition).toHaveBeenCalledTimes(2);
                    return [2 /*return*/];
            }
        });
    }); });
    test('will work ok if pollCondition throws', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pollCondition, onSuccess, task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pollCondition = jest
                        .fn()
                        .mockRejectedValueOnce(new Error('pepe'))
                        .mockResolvedValueOnce(true);
                    onSuccess = jest.fn();
                    task = task_1.conditionWatcher({
                        name: 'testCondition',
                        onSuccess: onSuccess,
                        pollCondition: pollCondition,
                        timeInBetweenMS: 10,
                    });
                    return [4 /*yield*/, async_1.sleep(25)];
                case 1:
                    _a.sent();
                    expect(task.isRunning()).toBeFalsy();
                    expect(onSuccess).toHaveBeenCalled();
                    expect(pollCondition).toHaveBeenCalledTimes(2);
                    return [2 /*return*/];
            }
        });
    }); });
    test('will work ok if onSuccess throws', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pollCondition, onSuccess, task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pollCondition = jest.fn().mockResolvedValue(true);
                    onSuccess = jest.fn().mockRejectedValue(new Error('fail'));
                    task = task_1.conditionWatcher({
                        name: 'testCondition',
                        onSuccess: onSuccess,
                        pollCondition: pollCondition,
                        timeInBetweenMS: 10,
                    });
                    return [4 /*yield*/, async_1.sleep(25)];
                case 1:
                    _a.sent();
                    expect(task.isRunning()).toBeFalsy();
                    expect(onSuccess).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('tryObtainValueWithRetries()', function () {
    test('will return value if suceeds before retries expires', function () { return __awaiter(void 0, void 0, void 0, function () {
        var task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    task = task_1.tryObtainValueWithRetries({
                        name: 'testGet',
                        maxAttemps: 2,
                        tryGetValue: jest
                            .fn()
                            .mockResolvedValueOnce(null)
                            .mockResolvedValueOnce('HELLO'),
                        timeInBetweenMS: 7,
                    });
                    return [4 /*yield*/, expect(task.onValue()).resolves.toBe('HELLO')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('will reject on maxAttemps', function () { return __awaiter(void 0, void 0, void 0, function () {
        var task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    task = task_1.tryObtainValueWithRetries({
                        name: 'testGet',
                        maxAttemps: 2,
                        tryGetValue: jest
                            .fn()
                            .mockResolvedValueOnce(null)
                            .mockResolvedValueOnce(null)
                            .mockResolvedValueOnce('HELLO'),
                        timeInBetweenMS: 7,
                    });
                    return [4 /*yield*/, expect(task.onValue()).rejects.toThrow('Max Retries')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('works on when tryGetValue throws', function () { return __awaiter(void 0, void 0, void 0, function () {
        var task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    task = task_1.tryObtainValueWithRetries({
                        name: 'testGet',
                        maxAttemps: 2,
                        tryGetValue: jest
                            .fn()
                            .mockRejectedValueOnce(new Error('error'))
                            .mockResolvedValueOnce('HELLO'),
                        timeInBetweenMS: 7,
                    });
                    return [4 /*yield*/, expect(task.onValue()).resolves.toBe('HELLO')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('stops when task.stop() is called', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tryGetValue, task, currentCalls;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tryGetValue = jest.fn().mockResolvedValue(null);
                    task = task_1.tryObtainValueWithRetries({
                        name: 'testGet',
                        maxAttemps: 15,
                        tryGetValue: tryGetValue,
                        timeInBetweenMS: 7,
                    });
                    return [4 /*yield*/, async_1.sleep(15)];
                case 1:
                    _a.sent();
                    task.stop();
                    return [4 /*yield*/, expect(task.onValue()).rejects.toThrow('Cancelled')];
                case 2:
                    _a.sent();
                    currentCalls = tryGetValue.mock.calls.length;
                    return [4 /*yield*/, async_1.sleep(10)];
                case 3:
                    _a.sent();
                    expect(tryGetValue).toHaveBeenCalledTimes(currentCalls);
                    expect(task.isRunning()).toBeFalsy();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=task.test.js.map