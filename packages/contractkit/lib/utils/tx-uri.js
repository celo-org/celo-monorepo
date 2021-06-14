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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var bn_js_1 = __importDefault(require("bn.js"));
var lodash_1 = require("lodash");
var qrcode_1 = __importDefault(require("qrcode"));
var querystring_1 = __importDefault(require("querystring"));
var web3_eth_abi_1 = __importDefault(require("web3-eth-abi"));
// see https://solidity.readthedocs.io/en/v0.5.3/abi-spec.html#function-selector-and-argument-encoding
var ABI_TYPE_REGEX = '(u?int(8|16|32|64|128|256)|address|bool|bytes(4|32)?|string)(\\[\\])?';
var FUNCTION_REGEX = "(?<function>\\w+\\((?<inputTypes>(,?" + ABI_TYPE_REGEX + ")*)\\))";
var ADDRESS_REGEX_STR = '(?<address>0x[a-fA-F0-9]{40})';
var CHAIN_ID_REGEX = '(?<chainId>\\d+)';
var TX_PARAMS = ['feeCurrency', 'gas', 'gasPrice', 'value', 'gatewayFee', 'gatewayFeeRecipient'];
var PARAM_REGEX = "(" + TX_PARAMS.join('|') + ")=\\w+";
var ARGS_REGEX = 'args=\\[(,?\\w+)*\\]';
var QUERY_REGEX = "(?<query>(&?(" + PARAM_REGEX + "|" + ARGS_REGEX + "))+)";
// URI scheme mostly borrowed from https://github.com/ethereum/EIPs/blob/master/EIPS/eip-681.md
var URI_REGEX_STR = "^celo:" + ADDRESS_REGEX_STR + "(@" + CHAIN_ID_REGEX + ")?(/" + FUNCTION_REGEX + ")?(\\?" + QUERY_REGEX + ")?$";
var uriRegexp = new RegExp(URI_REGEX_STR);
function parseUri(uri) {
    var matchObj = uriRegexp.exec(uri);
    if (matchObj == null) {
        throw new Error("URI " + uri + "\n did not match\n " + URI_REGEX_STR);
    }
    var namedGroups = matchObj.groups;
    var tx = {
        to: namedGroups.address,
    };
    if (namedGroups.chainId !== undefined) {
        tx.chainId = namedGroups.chainId;
    }
    if (namedGroups.query !== undefined) {
        var parsedQuery = querystring_1.default.parse(namedGroups.query);
        if (namedGroups.function !== undefined) {
            var functionSig = web3_eth_abi_1.default.encodeFunctionSignature(namedGroups.function);
            tx.data = functionSig;
            if (namedGroups.inputTypes !== undefined) {
                var abiTypes = namedGroups.inputTypes.split(',');
                var rawArgs = (parsedQuery.args || '[]');
                var builtArgs = rawArgs.slice(1, rawArgs.length - 1).split(',');
                var callSig = web3_eth_abi_1.default.encodeParameters(abiTypes, builtArgs);
                tx.data += address_1.trimLeading0x(callSig);
            }
        }
        var args = parsedQuery.args, txParams = __rest(parsedQuery, ["args"]);
        tx = __assign(__assign({}, tx), txParams);
    }
    return tx;
}
exports.parseUri = parseUri;
function buildUri(tx, functionName, abiTypes) {
    if (abiTypes === void 0) { abiTypes = []; }
    if (!tx.to) {
        throw new Error("'to' address must be defined for celo URIs");
    }
    var uri = "celo:" + tx.to;
    if (tx.chainId) {
        uri += "@" + tx.chainId;
    }
    var functionArgs;
    if (tx.data !== undefined) {
        if (!functionName) {
            throw new Error("Cannot decode tx 'data' without 'functionName'");
        }
        var functionSelector = functionName + "(" + abiTypes.join(',') + ")";
        var functionSig = address_1.trimLeading0x(web3_eth_abi_1.default.encodeFunctionSignature(functionSelector));
        var txData = address_1.trimLeading0x(tx.data);
        var funcEncoded = txData.slice(0, 8);
        if (functionSig !== funcEncoded) {
            throw new Error("'functionName' and 'abiTypes' do not match first 4 bytes of 'tx.data'");
        }
        uri += "/" + functionSelector;
        if (txData.length > 8) {
            var argsEncoded = txData.slice(8);
            var decoded_1 = web3_eth_abi_1.default.decodeParameters(abiTypes, argsEncoded);
            functionArgs = lodash_1.range(0, decoded_1.__length__).map(function (idx) { return decoded_1[idx].toLowerCase(); });
        }
    }
    var data = tx.data, to = tx.to, chainId = tx.chainId, nonce = tx.nonce, hardfork = tx.hardfork, common = tx.common, chain = tx.chain, txQueryParams = __rest(tx, ["data", "to", "chainId", "nonce", "hardfork", "common", "chain"]);
    uri += '?';
    if (functionArgs) {
        uri += "args=[" + functionArgs.join(',') + "]";
    }
    var params = txQueryParams;
    if (txQueryParams.value instanceof bn_js_1.default) {
        params.value = txQueryParams.value.toString();
    }
    uri += querystring_1.default.stringify(__assign({}, params));
    return uri;
}
exports.buildUri = buildUri;
function QrFromUri(uri, type) {
    if (!uriRegexp.test(uri)) {
        throw new Error("Invalid uri " + uri);
    }
    return qrcode_1.default.toString(uri, { type: type });
}
exports.QrFromUri = QrFromUri;
//# sourceMappingURL=tx-uri.js.map