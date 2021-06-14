"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noopLogger = function () {
    /*noop*/
};
exports.prefixLogger = function (prefix, logger) {
    if (logger === exports.noopLogger) {
        return exports.noopLogger;
    }
    else {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return logger.apply(void 0, __spreadArrays([prefix + ":: "], args));
        };
    }
};
exports.consoleLogger = console.log;
//# sourceMappingURL=logger.js.map