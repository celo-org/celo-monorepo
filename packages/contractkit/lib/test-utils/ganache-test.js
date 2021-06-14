"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var web3_1 = __importDefault(require("web3"));
var debug_provider_1 = require("../providers/debug-provider");
// This file specifies accounts available when ganache is running. These are derived
// from the MNEMONIC
exports.NetworkConfig = JSON.parse(fs.readFileSync('src/test-utils/migration-override.json').toString());
function jsonRpcCall(web3, method, params) {
    return new Promise(function (resolve, reject) {
        web3.currentProvider.send({
            id: new Date().getTime(),
            jsonrpc: '2.0',
            method: method,
            params: params,
        }, function (err, res) {
            if (err) {
                reject(err);
            }
            else if (!res) {
                reject(new Error('no response'));
            }
            else if (res.error) {
                reject(new Error("Failed JsonRPCResponse: method: " + method + " params: " + params + " error: " + JSON.stringify(res.error)));
            }
            else {
                resolve(res.result);
            }
        });
    });
}
exports.jsonRpcCall = jsonRpcCall;
function evmRevert(web3, snapId) {
    return jsonRpcCall(web3, 'evm_revert', [snapId]);
}
exports.evmRevert = evmRevert;
function evmSnapshot(web3) {
    return jsonRpcCall(web3, 'evm_snapshot', []);
}
exports.evmSnapshot = evmSnapshot;
function testWithGanache(name, fn) {
    var _this = this;
    var web3 = new web3_1.default('http://localhost:8545');
    debug_provider_1.injectDebugProvider(web3);
    describe(name, function () {
        var snapId = null;
        beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(snapId != null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, evmRevert(web3, snapId)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, evmSnapshot(web3)];
                    case 3:
                        snapId = _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        afterAll(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(snapId != null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, evmRevert(web3, snapId)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
        fn(web3);
    });
}
exports.testWithGanache = testWithGanache;
//# sourceMappingURL=ganache-test.js.map