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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var subproviders_1 = require("@0x/subproviders");
var debug_1 = __importDefault(require("debug"));
var debug = debug_1.default('kit:web3:providers:wrapping-subprovider');
var WrappingSubprovider = /** @class */ (function (_super) {
    __extends(WrappingSubprovider, _super);
    function WrappingSubprovider(provider) {
        var _this = _super.call(this) || this;
        _this.provider = provider;
        return _this;
    }
    /**
     * @param payload JSON RPC request payload
     * @param next A callback to pass the request to the next subprovider in the stack
     * @param end A callback called once the subprovider is done handling the request
     */
    WrappingSubprovider.prototype.handleRequest = function (payload, _next, end) {
        debug('handleRequest: %o', payload);
        // Inspired from https://github.com/MetaMask/web3-provider-engine/pull/19/
        return this.provider.send(payload, function (err, response) {
            if (err != null) {
                debug('response is error: %s', err);
                end(err);
                return;
            }
            if (response == null) {
                end(new Error("Response is null for " + JSON.stringify(payload)));
                return;
            }
            if (response.error != null) {
                debug('response includes error: %o', response);
                end(new Error(response.error));
                return;
            }
            debug('response: %o', response);
            end(null, response.result);
        });
    };
    return WrappingSubprovider;
}(subproviders_1.Subprovider));
exports.WrappingSubprovider = WrappingSubprovider;
//# sourceMappingURL=wrapping-subprovider.js.map