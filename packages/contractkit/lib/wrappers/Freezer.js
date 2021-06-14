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
var FreezerWrapper = /** @class */ (function (_super) {
    __extends(FreezerWrapper, _super);
    function FreezerWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.freeze = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.freeze);
        _this.unfreeze = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.unfreeze);
        _this.isFrozen = BaseWrapper_1.proxyCall(_this.contract.methods.isFrozen);
        return _this;
    }
    return FreezerWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.FreezerWrapper = FreezerWrapper;
//# sourceMappingURL=Freezer.js.map