"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copied from '@ledgerhq/hw-app-eth/erc20' because we need to change the path of the blob and support for address+chainId
var address_1 = require("@celo/utils/lib/address");
var data_1 = __importDefault(require("./data"));
/**
 * Retrieve the token information by a given contract address and chainId if any
 */
exports.tokenInfoByAddressAndChainId = function (contract, chainId) { return get().byContractKey(generateContractKey(contract, chainId)); };
/**
 * list all the ERC20 tokens informations
 */
exports.list = function () { return get().list(); };
/**
 * @return
 * -1: version1 < version2,
 *  0: version1 == version2,
 *  1: version1 > version2
 */
function compareLedgerAppVersions(version1, version2) {
    var numberV1 = stringVersionToNumber(version1);
    var numberV2 = stringVersionToNumber(version2);
    return numberV1 < numberV2 ? -1 : numberV1 === numberV2 ? 0 : 1;
}
exports.compareLedgerAppVersions = compareLedgerAppVersions;
function stringVersionToNumber(version) {
    var parts = version.split('.');
    return parts.reduce(function (accum, part) { return (accum + Number(part)) * 1000; }, 0);
}
function generateContractKey(contract, chainId) {
    return [address_1.normalizeAddressWith0x(contract), chainId].join('-');
}
// this internal get() will lazy load and cache the data from the erc20 data blob
var get = (function () {
    var cache;
    return function () {
        if (cache) {
            return cache;
        }
        var buf = Buffer.from(data_1.default, 'base64');
        var byContract = {};
        var entries = [];
        var i = 0;
        while (i < buf.length) {
            var length_1 = buf.readUInt32BE(i);
            i += 4;
            var item = buf.slice(i, i + length_1);
            var j = 0;
            var tickerLength = item.readUInt8(j);
            j += 1;
            var ticker = item.slice(j, j + tickerLength).toString('ascii');
            j += tickerLength;
            var contractAddress = address_1.normalizeAddressWith0x(item.slice(j, j + 20).toString('hex'));
            j += 20;
            var decimals = item.readUInt32BE(j);
            j += 4;
            var chainId = item.readUInt32BE(j);
            j += 4;
            var signature = item.slice(j);
            var entry = {
                ticker: ticker,
                contractAddress: contractAddress,
                decimals: decimals,
                chainId: chainId,
                signature: signature,
                data: item,
            };
            entries.push(entry);
            byContract[generateContractKey(contractAddress, chainId)] = entry;
            i += length_1;
        }
        var api = {
            list: function () { return entries; },
            byContractKey: function (id) { return byContract[id]; },
        };
        cache = api;
        return api;
    };
})();
//# sourceMappingURL=tokens.js.map