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
Object.defineProperty(exports, "__esModule", { value: true });
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Network parameters that are configurable by governance.
 */
var BlockchainParametersWrapper = /** @class */ (function (_super) {
    __extends(BlockchainParametersWrapper, _super);
    function BlockchainParametersWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.
         */
        _this.setIntrinsicGasForAlternativeFeeCurrency = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setIntrinsicGasForAlternativeFeeCurrency);
        /**
         * Getting the block gas limit.
         */
        _this.getBlockGasLimit = BaseWrapper_1.proxyCall(_this.contract.methods.blockGasLimit, undefined, BaseWrapper_1.valueToInt);
        /**
         * Setting the block gas limit.
         */
        _this.setBlockGasLimit = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setBlockGasLimit);
        /**
         * Set minimum client version.
         */
        _this.setMinimumClientVersion = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.setMinimumClientVersion);
        return _this;
    }
    return BlockchainParametersWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.BlockchainParametersWrapper = BlockchainParametersWrapper;
//# sourceMappingURL=BlockchainParameters.js.map