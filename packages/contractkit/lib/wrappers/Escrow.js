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
 * Contract for handling reserve for stable currencies
 */
var EscrowWrapper = /** @class */ (function (_super) {
    __extends(EscrowWrapper, _super);
    function EscrowWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.escrowedPayments = BaseWrapper_1.proxyCall(_this.contract.methods.escrowedPayments);
        _this.receivedPaymentIds = BaseWrapper_1.proxyCall(_this.contract.methods.receivedPaymentIds);
        _this.sentPaymentIds = BaseWrapper_1.proxyCall(_this.contract.methods.sentPaymentIds);
        _this.getReceivedPaymentIds = BaseWrapper_1.proxyCall(_this.contract.methods.getReceivedPaymentIds);
        _this.getSentPaymentIds = BaseWrapper_1.proxyCall(_this.contract.methods.getSentPaymentIds);
        _this.transfer = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transfer);
        _this.withdraw = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.withdraw);
        _this.revoke = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.revoke);
        return _this;
    }
    return EscrowWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.EscrowWrapper = EscrowWrapper;
//# sourceMappingURL=Escrow.js.map