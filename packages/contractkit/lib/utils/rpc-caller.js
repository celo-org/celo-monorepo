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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var debugRpcPayload = debug_1.default('rpc:payload');
var debugRpcResponse = debug_1.default('rpc:response');
var debugRpcCallback = debug_1.default('rpc:callback:exception');
function rpcCallHandler(payload, handler, callback) {
    try {
        handler(payload)
            .then(function (result) {
            callback(null, toRPCResponse(payload, result));
        }, 
        // Called if the Promise of the 'handler' fails
        function (error) {
            callback(error, toRPCResponse(payload, null, error));
        })
            .catch(function (error) {
            // Called if the 'callback' fails
            debugRpcCallback('Callback for handling the JsonRpcResponse fails');
            debugRpcCallback('%O', error);
        });
    }
    catch (error) {
        // Called if the handler fails before making the promise
        callback(error);
    }
}
exports.rpcCallHandler = rpcCallHandler;
// Ported from: https://github.com/MetaMask/provider-engine/blob/master/util/random-id.js
function getRandomId() {
    var extraDigits = 3;
    var baseTen = 10;
    // 13 time digits
    var datePart = new Date().getTime() * Math.pow(baseTen, extraDigits);
    // 3 random digits
    var extraPart = Math.floor(Math.random() * Math.pow(baseTen, extraDigits));
    // 16 digits
    return datePart + extraPart;
}
exports.getRandomId = getRandomId;
function toRPCResponse(payload, result, error) {
    var response = {
        id: Number(payload.id),
        jsonrpc: payload.jsonrpc,
        result: result,
    };
    if (error != null) {
        ;
        response.error = {
            message: error.message || error.stack || error,
            code: -32000,
        };
    }
    return response;
}
var DefaultRpcCaller = /** @class */ (function () {
    function DefaultRpcCaller(defaultProvider, jsonrpcVersion) {
        if (jsonrpcVersion === void 0) { jsonrpcVersion = '2.0'; }
        this.defaultProvider = defaultProvider;
        this.jsonrpcVersion = jsonrpcVersion;
    }
    DefaultRpcCaller.prototype.call = function (method, params) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var payload = {
                            id: getRandomId(),
                            jsonrpc: _this.jsonrpcVersion,
                            method: method,
                            params: params,
                        };
                        _this.send(payload, (function (err, response) {
                            if (err != null) {
                                reject(err);
                            }
                            else {
                                resolve(response);
                            }
                        }));
                    })];
            });
        });
    };
    DefaultRpcCaller.prototype.send = function (payload, callback) {
        debugRpcPayload('%O', payload);
        var decoratedCallback = (function (error, result) {
            var err = error;
            debugRpcResponse('%O', result);
            // The provider send call will not provide an error to the callback if
            // the result itself specifies an error. Here, we extract the error in the
            // result.
            if (result.error != null &&
                typeof result.error !== 'string' &&
                result.error.message != null) {
                err = new Error(result.error.message);
            }
            callback(err, result);
        });
        if (this.defaultProvider && typeof this.defaultProvider !== 'string') {
            this.defaultProvider.send(payload, decoratedCallback);
        }
    };
    return DefaultRpcCaller;
}());
exports.DefaultRpcCaller = DefaultRpcCaller;
//# sourceMappingURL=rpc-caller.js.map