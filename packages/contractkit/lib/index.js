"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var web3_1 = __importDefault(require("web3"));
var base_1 = require("./base");
exports.AllContracts = base_1.AllContracts;
exports.CeloContract = base_1.CeloContract;
exports.NULL_ADDRESS = base_1.NULL_ADDRESS;
var identity_1 = require("./identity");
exports.IdentityMetadataWrapper = identity_1.IdentityMetadataWrapper;
__export(require("./kit"));
var genesis_block_utils_1 = require("./network-utils/genesis-block-utils");
exports.GenesisBlockUtils = genesis_block_utils_1.GenesisBlockUtils;
var static_node_utils_1 = require("./network-utils/static-node-utils");
exports.StaticNodeUtils = static_node_utils_1.StaticNodeUtils;
var celo_provider_1 = require("./providers/celo-provider");
exports.CeloProvider = celo_provider_1.CeloProvider;
var BaseWrapper_1 = require("./wrappers/BaseWrapper");
exports.CeloTransactionObject = BaseWrapper_1.CeloTransactionObject;
/**
 * Creates a new web3 instance
 * @param url node url
 */
function newWeb3(url) {
    return new web3_1.default(url);
}
exports.newWeb3 = newWeb3;
//# sourceMappingURL=index.js.map