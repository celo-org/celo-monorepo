"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var async_1 = require("@celo/utils/lib/async");
var ethereumjs_util_1 = require("ethereumjs-util");
var base_1 = require("../explorer/base");
var block_explorer_1 = require("../explorer/block-explorer");
var Governance_1 = require("../generated/Governance");
var web3_utils_1 = require("../utils/web3-utils");
var BaseWrapper_1 = require("../wrappers/BaseWrapper");
var Governance_2 = require("../wrappers/Governance");
var proxy_1 = require("./proxy");
exports.HOTFIX_PARAM_ABI_TYPES = web3_utils_1.getAbiTypes(Governance_1.ABI, 'executeHotfix');
exports.hotfixToEncodedParams = function (kit, proposal, salt) {
    return kit.web3.eth.abi.encodeParameters(exports.HOTFIX_PARAM_ABI_TYPES, Governance_2.hotfixToParams(proposal, salt));
};
exports.hotfixToHash = function (kit, proposal, salt) {
    return ethereumjs_util_1.keccak256(exports.hotfixToEncodedParams(kit, proposal, salt));
};
/**
 * Convert a compiled proposal to a human-readable JSON form using network information.
 * @param kit Contract kit instance used to resolve addresses to contract names.
 * @param proposal A constructed proposal object.
 * @returns The JSON encoding of the proposal.
 */
exports.proposalToJSON = function (kit, proposal) { return __awaiter(void 0, void 0, void 0, function () {
    var contractDetails, blockExplorer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, base_1.obtainKitContractDetails(kit)];
            case 1:
                contractDetails = _a.sent();
                blockExplorer = new block_explorer_1.BlockExplorer(kit, contractDetails);
                return [2 /*return*/, async_1.concurrentMap(4, proposal, function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var parsedTx;
                        return __generator(this, function (_a) {
                            parsedTx = blockExplorer.tryParseTx(tx);
                            if (parsedTx == null) {
                                throw new Error("Unable to parse " + tx + " with block explorer");
                            }
                            return [2 /*return*/, {
                                    contract: parsedTx.callDetails.contract,
                                    function: parsedTx.callDetails.function,
                                    args: parsedTx.callDetails.argList,
                                    params: parsedTx.callDetails.paramMap,
                                    value: parsedTx.tx.value,
                                }];
                        });
                    }); })];
        }
    });
}); };
/**
 * Builder class to construct proposals from JSON or transaction objects.
 */
var ProposalBuilder = /** @class */ (function () {
    function ProposalBuilder(kit, builders) {
        var _this = this;
        if (builders === void 0) { builders = []; }
        this.kit = kit;
        this.builders = builders;
        /**
         * Build calls all of the added build steps and returns the final proposal.
         * @returns A constructed Proposal object (i.e. a list of ProposalTransaction)
         */
        this.build = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, async_1.concurrentMap(4, this.builders, function (builder) { return builder(); })
                /**
                 * Converts a Web3 transaction into a proposal transaction object.
                 * @param tx A Web3 transaction object to convert.
                 * @param params Parameters for how the transaction should be executed.
                 */
            ];
        }); }); };
        /**
         * Converts a Web3 transaction into a proposal transaction object.
         * @param tx A Web3 transaction object to convert.
         * @param params Parameters for how the transaction should be executed.
         */
        this.fromWeb3tx = function (tx, params) { return ({
            value: params.value,
            to: params.to,
            input: tx.encodeABI(),
        }); };
        /**
         * Adds a transaction to set the implementation on a proxy to the given address.
         * @param contract Celo contract name of the proxy which should have its implementation set.
         * @param newImplementationAddress Address of the new contract implementation.
         */
        this.addProxyRepointingTx = function (contract, newImplementationAddress) {
            _this.builders.push(function () { return __awaiter(_this, void 0, void 0, function () {
                var proxy;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.kit._web3Contracts.getContract(contract)];
                        case 1:
                            proxy = _a.sent();
                            return [2 /*return*/, this.fromWeb3tx(proxy_1.setImplementationOnProxy(newImplementationAddress), {
                                    to: proxy.options.address,
                                    value: '0',
                                })];
                    }
                });
            }); });
        };
        /**
         * Adds a Web3 transaction to the list for proposal construction.
         * @param tx A Web3 transaction object to add to the proposal.
         * @param params Parameters for how the transaction should be executed.
         */
        this.addWeb3Tx = function (tx, params) {
            return _this.builders.push(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, this.fromWeb3tx(tx, params)];
            }); }); });
        };
        /**
         * Adds a JSON encoded proposal transaction to the builder list.
         * @param tx A JSON encoded proposal transaction.
         */
        this.addJsonTx = function (tx) {
            return _this.builders.push(function () { return __awaiter(_this, void 0, void 0, function () {
                var contract, methodName, method, txo;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.kit._web3Contracts.getContract(tx.contract)];
                        case 1:
                            contract = _a.sent();
                            methodName = tx.function;
                            method = contract.methods[methodName];
                            if (!method) {
                                throw new Error("Method " + methodName + " not found on " + tx.contract);
                            }
                            txo = method.apply(void 0, tx.args);
                            if (!txo) {
                                throw new Error("Arguments " + tx.args + " did not match " + methodName + " signature");
                            }
                            if (tx.value === undefined) {
                                tx.value = '0';
                            }
                            // TODO fix types
                            return [2 /*return*/, this.fromWeb3tx(txo, { to: contract._address, value: tx.value })];
                    }
                });
            }); });
        };
    }
    /**
     * Adds a Celo transaction to the list for proposal construction.
     * @param tx A Celo transaction object to add to the proposal.
     * @param params Optional parameters for how the transaction should be executed.
     */
    ProposalBuilder.prototype.addTx = function (tx, params) {
        if (params === void 0) { params = {}; }
        var _a, _b, _c, _d;
        var to = (_a = params.to) !== null && _a !== void 0 ? _a : (_b = tx.defaultParams) === null || _b === void 0 ? void 0 : _b.to;
        var value = (_c = params.value) !== null && _c !== void 0 ? _c : (_d = tx.defaultParams) === null || _d === void 0 ? void 0 : _d.value;
        if (!to || !value) {
            throw new Error("Transaction parameters 'to' and/or 'value' not provided");
        }
        // TODO fix type of value
        this.addWeb3Tx(tx.txo, { to: to, value: BaseWrapper_1.valueToString(value.toString()) });
    };
    return ProposalBuilder;
}());
exports.ProposalBuilder = ProposalBuilder;
//# sourceMappingURL=proposals.js.map