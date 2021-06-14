"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var collections_1 = require("@celo/utils/lib/collections");
var fixidity_1 = require("@celo/utils/lib/fixidity");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
/** Base ContractWrapper */
var BaseWrapper = /** @class */ (function () {
    function BaseWrapper(kit, contract) {
        this.kit = kit;
        this.contract = contract;
        this.events = this.contract.events;
    }
    Object.defineProperty(BaseWrapper.prototype, "address", {
        /** Contract address */
        get: function () {
            // TODO fix typings
            return this.contract._address;
        },
        enumerable: true,
        configurable: true
    });
    /** Contract getPastEvents */
    BaseWrapper.prototype.getPastEvents = function (event, options) {
        return this.contract.getPastEvents(event, options);
    };
    return BaseWrapper;
}());
exports.BaseWrapper = BaseWrapper;
exports.valueToBigNumber = function (input) { return new bignumber_js_1.default(input); };
exports.fixidityValueToBigNumber = function (input) { return fixidity_1.fromFixed(new bignumber_js_1.default(input)); };
exports.valueToString = function (input) { return exports.valueToBigNumber(input).toFixed(); };
exports.valueToFixidityString = function (input) {
    return fixidity_1.toFixed(exports.valueToBigNumber(input)).toFixed();
};
exports.valueToInt = function (input) {
    return exports.valueToBigNumber(input)
        .integerValue()
        .toNumber();
};
exports.valueToFrac = function (numerator, denominator) {
    return exports.valueToBigNumber(numerator).div(exports.valueToBigNumber(denominator));
};
exports.stringToSolidityBytes = function (input) { return address_1.ensureLeading0x(input); };
exports.bufferToSolidityBytes = function (input) { return exports.stringToSolidityBytes(address_1.bufferToHex(input)); };
exports.solidityBytesToString = function (input) {
    if (input === null || input === undefined || typeof input === 'string') {
        return input;
    }
    else if (Array.isArray(input)) {
        var hexString = input.reduce(function (acc, num) { return acc + num.toString(16).padStart(2, '0'); }, '');
        return address_1.ensureLeading0x(hexString);
    }
    else {
        throw new Error('Unexpected input type for solidity bytes');
    }
};
/** Identity Parser */
exports.identity = function (a) { return a; };
exports.stringIdentity = function (x) { return x; };
function tupleParser() {
    var parsers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parsers[_i] = arguments[_i];
    }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return collections_1.zip(function (parser, input) { return parser(input); }, parsers, args);
    };
}
exports.tupleParser = tupleParser;
function proxyCall() {
    var callArgs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        callArgs[_i] = arguments[_i];
    }
    if (callArgs.length === 3 && callArgs[1] != null) {
        var methodFn_1 = callArgs[0];
        var parseInputArgs_1 = callArgs[1];
        var parseOutput_1 = callArgs[2];
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return methodFn_1.apply(void 0, parseInputArgs_1.apply(void 0, args)).call()
                .then(parseOutput_1);
        };
    }
    else if (callArgs.length === 3) {
        var methodFn_2 = callArgs[0];
        var parseOutput_2 = callArgs[2];
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return methodFn_2.apply(void 0, args).call()
                .then(parseOutput_2);
        };
    }
    else if (callArgs.length === 2) {
        var methodFn_3 = callArgs[0];
        var parseInputArgs_2 = callArgs[1];
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return methodFn_3.apply(void 0, parseInputArgs_2.apply(void 0, args)).call();
        };
    }
    else {
        var methodFn_4 = callArgs[0];
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return methodFn_4.apply(void 0, args).call();
        };
    }
}
exports.proxyCall = proxyCall;
/**
 * Creates a proxy to send a tx on a web3 native contract method.
 *
 * There are 2 cases:
 *  - call methodFn (no pre or post parsing)
 *  - preParse arguments & call methodFn
 *
 * @param methodFn Web3 methods function
 * @param preParse [optional] preParse function, tranforms arguments into `methodFn` expected inputs
 */
function proxySend(kit) {
    var sendArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sendArgs[_i - 1] = arguments[_i];
    }
    if (sendArgs.length === 2) {
        var methodFn_5 = sendArgs[0];
        var preParse_1 = sendArgs[1];
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return toTransactionObject(kit, methodFn_5.apply(void 0, preParse_1.apply(void 0, args)));
        };
    }
    else {
        var methodFn_6 = sendArgs[0];
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return toTransactionObject(kit, methodFn_6.apply(void 0, args));
        };
    }
}
exports.proxySend = proxySend;
function toTransactionObject(kit, txo, defaultParams) {
    return new CeloTransactionObject(kit, txo, defaultParams);
}
exports.toTransactionObject = toTransactionObject;
var CeloTransactionObject = /** @class */ (function () {
    function CeloTransactionObject(kit, txo, defaultParams) {
        var _this = this;
        this.kit = kit;
        this.txo = txo;
        this.defaultParams = defaultParams;
        /** send the transaction to the chain */
        this.send = function (params) {
            return _this.kit.sendTransactionObject(_this.txo, __assign(__assign({}, _this.defaultParams), params));
        };
        /** send the transaction and waits for the receipt */
        this.sendAndWaitForReceipt = function (params) {
            return _this.send(params).then(function (result) { return result.waitReceipt(); });
        };
    }
    return CeloTransactionObject;
}());
exports.CeloTransactionObject = CeloTransactionObject;
//# sourceMappingURL=BaseWrapper.js.map