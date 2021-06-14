"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var debugPayload = debug_1.default('web3:rpc:payload');
var debugResponse = debug_1.default('web3:rpc:response');
var DebugProvider = /** @class */ (function () {
    function DebugProvider(provider) {
        this.provider = provider;
    }
    DebugProvider.prototype.send = function (payload, callback) {
        debugPayload('%O', payload);
        var callbackDecorator = function (error, result) {
            debugResponse('%O', result);
            callback(error, result);
        };
        return this.provider.send(payload, callbackDecorator);
    };
    return DebugProvider;
}());
function wrap(provider) {
    return new DebugProvider(provider);
}
exports.wrap = wrap;
function injectDebugProvider(web3) {
    web3.setProvider(wrap(web3.currentProvider));
}
exports.injectDebugProvider = injectDebugProvider;
//# sourceMappingURL=debug-provider.js.map