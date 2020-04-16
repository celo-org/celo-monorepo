"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BN = require("bn.js");
var evm_1 = require("../evm");
var exceptions_1 = require("../../exceptions");
var ethereumjs_util_1 = require("ethereumjs-util");
var assert = require('assert');
function default_1(opts) {
    var gasUsed = new BN(1050);
    assert(opts.data);
    var results = {};
    if (opts.gasLimit.lt(gasUsed)) {
        return evm_1.OOGResult(opts.gasLimit);
    }
    var aNumerator = new BN(opts.data.slice(0, 32));
    var aDenominator = new BN(opts.data.slice(32, 64));
    var bNumerator = new BN(opts.data.slice(64, 96));
    var bDenominator = new BN(opts.data.slice(96, 128));
    var exponent = new BN(opts.data.slice(128, 160));
    var decimals = new BN(opts.data.slice(160, 192));
    if (aDenominator.isZero() || bDenominator.isZero()) {
        return {
            returnValue: Buffer.alloc(0),
            gasUsed: opts.gasLimit,
            exceptionError: new exceptions_1.VmError(exceptions_1.ERROR.REVERT),
        };
    }
    var numeratorExp = aNumerator.mul(bNumerator.pow(exponent));
    var denominatorExp = aDenominator.mul(bDenominator.pow(exponent));
    var decimalAdjustment = new BN(10).pow(decimals);
    var numeratorDecimalAdjusted = numeratorExp.mul(decimalAdjustment).div(denominatorExp);
    var denominatorDecimalAdjusted = decimalAdjustment;
    var numeratorBuf = numeratorDecimalAdjusted.toArrayLike(Buffer, 'be', 32);
    var denominatorBuf = denominatorDecimalAdjusted.toArrayLike(Buffer, 'be', 32);
    var numeratorPadded = ethereumjs_util_1.setLengthLeft(numeratorBuf, 32);
    var denominatorPadded = ethereumjs_util_1.setLengthLeft(denominatorBuf, 32);
    var returnValue = Buffer.concat([numeratorPadded, denominatorPadded]);
    return { returnValue: returnValue, gasUsed: gasUsed };
}
exports.default = default_1;
//# sourceMappingURL=fc-fractionmulexp.js.map