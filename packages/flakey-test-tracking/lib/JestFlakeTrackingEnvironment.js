"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var utils_1 = require("jest-circus/build/utils");
var jest_environment_node_1 = __importDefault(require("jest-environment-node"));
var FlakeNotifier_1 = require("./FlakeNotifier");
var JestFlakeTrackingEnvironment = /** @class */ (function (_super) {
    __extends(JestFlakeTrackingEnvironment, _super);
    function JestFlakeTrackingEnvironment(config) {
        var _this = _super.call(this, config) || this;
        _this.notifier = new FlakeNotifier_1.FlakeNotifier();
        _this.failures = new Map();
        _this.retryTimes = config.retryTimes;
        return _this;
    }
    JestFlakeTrackingEnvironment.prototype.handleTestEvent = function (event, state) {
        return __awaiter(this, void 0, void 0, function () {
            var runResult, flakes;
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (event.name === 'test_retry') {
                            console.log('TEST RETRY: ' + event.test.name);
                        }
                        if (!(event.name === 'run_finish')) return [3 /*break*/, 2];
                        runResult = utils_1.makeRunResult(state.rootDescribeBlock, state.unhandledErrors);
                        flakes = runResult.testResults.filter(function (testResult) { return testResult.invocations > 1 && testResult.errors.length === 0; });
                        // Restore all the error messages from retrying the flakey test
                        flakes.forEach(function (flake) {
                            var _a;
                            var name = flake.testPath[0];
                            if (_this.failures.has(name)) {
                                (_a = flake.errors).unshift.apply(_a, _this.failures.get(name));
                            }
                            else {
                                // This shouldn't happen
                                console.error('Flakey Test Errors Not Tracked');
                            }
                        });
                        return [4 /*yield*/, this.notifier.processFlakes(flakes)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        if (event.name === 'test_done') {
                            if (event.test.errors.length > 1) {
                                if (event.test.invocations < this.retryTimes) {
                                    // Test will be retried, save failure
                                    if (this.failures.has(event.test.name)) {
                                        (_a = this.failures.get(event.test.name)).push.apply(_a, event.test.errors);
                                    }
                                    else {
                                        this.failures.set(event.test.name, event.test.errors);
                                    }
                                }
                                else {
                                    // Test failed on every retry => not flakey
                                    this.failures.delete(event.test.name);
                                }
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return JestFlakeTrackingEnvironment;
}(jest_environment_node_1.default));
exports.default = JestFlakeTrackingEnvironment;
//# sourceMappingURL=JestFlakeTrackingEnvironment.js.map