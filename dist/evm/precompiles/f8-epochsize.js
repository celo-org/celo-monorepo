"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BN = require("bn.js");
var evm_1 = require("../evm");
var ethereumjs_util_1 = require("ethereumjs-util");
function default_1(opts) {
    var gasUsed = new BN(1000);
    if (opts.gasLimit.lt(gasUsed)) {
        return evm_1.OOGResult(opts.gasLimit);
    }
    var sizeBuf = new BN(100).toArrayLike(Buffer, 'be', 32);
    return {
        returnValue: ethereumjs_util_1.setLengthLeft(sizeBuf, 32),
        gasUsed: gasUsed,
    };
}
exports.default = default_1;
//# sourceMappingURL=f8-epochsize.js.map