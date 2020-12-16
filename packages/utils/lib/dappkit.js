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
Object.defineProperty(exports, "__esModule", { value: true });
var querystring_1 = require("querystring");
var url_1 = require("url");
exports.DAPPKIT_BASE_HOST = 'celo://wallet/dappkit';
var DappKitRequestTypes;
(function (DappKitRequestTypes) {
    DappKitRequestTypes["ACCOUNT_ADDRESS"] = "account_address";
    DappKitRequestTypes["SIGN_TX"] = "sign_tx";
})(DappKitRequestTypes = exports.DappKitRequestTypes || (exports.DappKitRequestTypes = {}));
var DappKitResponseStatus;
(function (DappKitResponseStatus) {
    DappKitResponseStatus["SUCCESS"] = "200";
    DappKitResponseStatus["UNAUTHORIZED"] = "401";
})(DappKitResponseStatus = exports.DappKitResponseStatus || (exports.DappKitResponseStatus = {}));
exports.AccountAuthRequest = function (meta) { return (__assign({ type: DappKitRequestTypes.ACCOUNT_ADDRESS }, meta)); };
exports.AccountAuthResponseSuccess = function (address, phoneNumber) { return ({
    type: DappKitRequestTypes.ACCOUNT_ADDRESS,
    status: DappKitResponseStatus.SUCCESS,
    address: address,
    phoneNumber: phoneNumber,
}); };
exports.SignTxResponseSuccess = function (rawTxs) { return ({
    type: DappKitRequestTypes.SIGN_TX,
    status: DappKitResponseStatus.SUCCESS,
    rawTxs: rawTxs,
}); };
function produceResponseDeeplink(request, response) {
    var params = { type: response.type, status: response.status, requestId: request.requestId };
    switch (response.type) {
        case DappKitRequestTypes.ACCOUNT_ADDRESS:
            if (response.status === DappKitResponseStatus.SUCCESS) {
                params.account = response.address;
                params.phoneNumber = response.phoneNumber;
            }
            break;
        case DappKitRequestTypes.SIGN_TX:
            if (response.status === DappKitResponseStatus.SUCCESS) {
                params.rawTxs = response.rawTxs;
            }
        default:
            break;
    }
    return request.callback + '?' + querystring_1.stringify(params);
}
exports.produceResponseDeeplink = produceResponseDeeplink;
exports.SignTxRequest = function (txs, meta) { return (__assign({ type: DappKitRequestTypes.SIGN_TX, txs: txs.map(function (tx) { return ({
        txData: tx.txData,
        estimatedGas: tx.estimatedGas,
        from: tx.from,
        to: tx.to,
        nonce: tx.nonce,
        feeCurrencyAddress: tx.feeCurrencyAddress,
        value: tx.value,
    }); }) }, meta)); };
function assertString(objectName, key, value) {
    if (value === undefined) {
        throw new Error("Expected " + objectName + " to contain " + key);
    }
    if (typeof value !== 'string') {
        throw new Error("Expected " + objectName + "[" + key + "] to be a string, but is " + typeof value);
    }
    return;
}
function serializeDappKitRequestDeeplink(request) {
    // TODO: Probably use a proper validation library here
    assertString('request', 'type', request.type);
    assertString('request', 'requestId', request.requestId);
    assertString('request', 'callback', request.callback);
    assertString('request', 'dappName', request.dappName);
    var params = {
        type: request.type,
        requestId: request.requestId,
        callback: request.callback,
        dappName: request.dappName,
    };
    switch (request.type) {
        case DappKitRequestTypes.SIGN_TX:
            params = __assign(__assign({}, params), { txs: Buffer.from(JSON.stringify(request.txs), 'utf8').toString('base64') });
            break;
        case DappKitRequestTypes.ACCOUNT_ADDRESS:
            break;
        default:
            throw new Error("Invalid DappKitRequest type: " + JSON.stringify(request));
    }
    return exports.DAPPKIT_BASE_HOST + '?' + querystring_1.stringify(params);
}
exports.serializeDappKitRequestDeeplink = serializeDappKitRequestDeeplink;
// TODO: parsing query params yields broad types
// once interface stabilizes, properly type the parsing
function parseDappkitResponseDeeplink(url) {
    var rawParams = url_1.parse(url, true);
    if (rawParams.query.type === undefined) {
        throw new Error('Invalid Deeplink: does not contain type:' + url);
    }
    if (rawParams.query.requestId === undefined) {
        throw new Error('Invalid Deeplink: does not contain requestId');
    }
    var requestId = rawParams.query.requestId;
    var address = rawParams.query.account;
    var phoneNumber = rawParams.query.phoneNumber;
    switch (rawParams.query.type) {
        case DappKitRequestTypes.ACCOUNT_ADDRESS:
            if (rawParams.query.status === DappKitResponseStatus.SUCCESS) {
                // @ts-ignore
                return {
                    type: DappKitRequestTypes.ACCOUNT_ADDRESS,
                    status: DappKitResponseStatus.SUCCESS,
                    address: address,
                    phoneNumber: phoneNumber,
                    requestId: requestId,
                };
            }
            else {
                return {
                    type: DappKitRequestTypes.ACCOUNT_ADDRESS,
                    status: DappKitResponseStatus.UNAUTHORIZED,
                    requestId: requestId,
                };
            }
        case DappKitRequestTypes.SIGN_TX:
            if (rawParams.query.status === DappKitResponseStatus.SUCCESS) {
                var rawTxs = rawParams.query.rawTxs;
                if (typeof rawTxs === 'string') {
                    rawTxs = [rawTxs];
                }
                // @ts-ignore
                return {
                    type: DappKitRequestTypes.SIGN_TX,
                    status: DappKitResponseStatus.SUCCESS,
                    rawTxs: rawTxs,
                    requestId: requestId,
                };
            }
            else {
                return {
                    type: DappKitRequestTypes.SIGN_TX,
                    status: DappKitResponseStatus.UNAUTHORIZED,
                    requestId: requestId,
                };
            }
        default:
            throw new Error('Invalid Deeplink: does not match defined requests');
    }
}
exports.parseDappkitResponseDeeplink = parseDappkitResponseDeeplink;
function parseDappKitRequestDeeplink(url) {
    var rawParams = url_1.parse(url, true);
    if (rawParams.query.type === undefined) {
        throw new Error('Invalid Deeplink: does not contain type:' + url);
    }
    if (!rawParams.query.dappName || !rawParams.query.callback || !rawParams.query.requestId) {
        throw new Error("Invalid Deeplink: Does not contain meta parameters: " + url);
    }
    var requestMeta = {
        // @ts-ignore
        callback: rawParams.query.callback,
        // @ts-ignore
        requestId: rawParams.query.requestId,
        // @ts-ignore
        dappName: rawParams.query.dappName,
    };
    switch (rawParams.query.type) {
        case DappKitRequestTypes.ACCOUNT_ADDRESS:
            return exports.AccountAuthRequest(requestMeta);
            break;
        case DappKitRequestTypes.SIGN_TX:
            // @ts-ignore
            return __assign({ type: DappKitRequestTypes.SIGN_TX, 
                // @ts-ignore
                txs: JSON.parse(Buffer.from(rawParams.query.txs, 'base64').toString('utf8')) }, requestMeta);
        default:
            throw new Error('Invalid Deeplink: does not match defined requests');
    }
}
exports.parseDappKitRequestDeeplink = parseDappKitRequestDeeplink;
//# sourceMappingURL=dappkit.js.map