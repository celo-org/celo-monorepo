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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = require("bignumber.js");
var debug_1 = __importDefault(require("debug"));
var net_1 = __importDefault(require("net"));
var web3_1 = __importDefault(require("web3"));
var address_registry_1 = require("./address-registry");
var base_1 = require("./base");
var contract_cache_1 = require("./contract-cache");
var celo_provider_1 = require("./providers/celo-provider");
var tx_result_1 = require("./utils/tx-result");
var web3_utils_1 = require("./utils/web3-utils");
var web3_contract_cache_1 = require("./web3-contract-cache");
var debug = debug_1.default('kit:kit');
/**
 * Creates a new instance of `ContractKit` give a nodeUrl
 * @param url CeloBlockchain node url
 * @optional wallet to reuse or add a wallet different that the default (example ledger-wallet)
 */
function newKit(url, wallet) {
    var web3 = url.endsWith('.ipc')
        ? new web3_1.default(new web3_1.default.providers.IpcProvider(url, net_1.default))
        : new web3_1.default(url);
    return newKitFromWeb3(web3, wallet);
}
exports.newKit = newKit;
/**
 * Creates a new instance of `ContractKit` give a web3 instance
 * @param web3 Web3 instance
 * @optional wallet to reuse or add a wallet different that the default (example ledger-wallet)
 */
function newKitFromWeb3(web3, wallet) {
    if (!web3.currentProvider) {
        throw new Error('Must have a valid Provider');
    }
    return new ContractKit(web3, wallet);
}
exports.newKitFromWeb3 = newKitFromWeb3;
function assertIsCeloProvider(provider) {
    if (!(provider instanceof celo_provider_1.CeloProvider)) {
        throw new Error('A different Provider was manually added to the kit. The kit should have a CeloProvider');
    }
}
var ContractKit = /** @class */ (function () {
    function ContractKit(web3, wallet) {
        this.web3 = web3;
        this.config = {
            gasInflationFactor: 1.3,
            // gasPrice:0 means the node will compute gasPrice on its own
            gasPrice: '0',
        };
        if (!(web3.currentProvider instanceof celo_provider_1.CeloProvider)) {
            var celoProviderInstance = new celo_provider_1.CeloProvider(web3.currentProvider, wallet);
            // as any because of web3 migration
            web3.setProvider(celoProviderInstance);
        }
        this.registry = new address_registry_1.AddressRegistry(this);
        this._web3Contracts = new web3_contract_cache_1.Web3ContractCache(this);
        this.contracts = new contract_cache_1.WrapperCache(this);
    }
    ContractKit.prototype.getTotalBalance = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var goldToken, stableToken, lockedGold, exchange, goldBalance, lockedBalance, dollarBalance, converted, pending, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.getGoldToken()];
                    case 1:
                        goldToken = _a.sent();
                        return [4 /*yield*/, this.contracts.getStableToken()];
                    case 2:
                        stableToken = _a.sent();
                        return [4 /*yield*/, this.contracts.getLockedGold()];
                    case 3:
                        lockedGold = _a.sent();
                        return [4 /*yield*/, this.contracts.getExchange()];
                    case 4:
                        exchange = _a.sent();
                        return [4 /*yield*/, goldToken.balanceOf(address)];
                    case 5:
                        goldBalance = _a.sent();
                        return [4 /*yield*/, lockedGold.getAccountTotalLockedGold(address)];
                    case 6:
                        lockedBalance = _a.sent();
                        return [4 /*yield*/, stableToken.balanceOf(address)];
                    case 7:
                        dollarBalance = _a.sent();
                        return [4 /*yield*/, exchange.quoteUsdSell(dollarBalance)];
                    case 8:
                        converted = _a.sent();
                        pending = new bignumber_js_1.BigNumber(0);
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, lockedGold.getPendingWithdrawalsTotalValue(address)];
                    case 10:
                        pending = _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        err_1 = _a.sent();
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/, {
                            gold: goldBalance,
                            lockedGold: lockedBalance,
                            usd: dollarBalance,
                            total: goldBalance
                                .plus(lockedBalance)
                                .plus(converted)
                                .plus(pending),
                            pending: pending,
                        }];
                }
            });
        });
    };
    ContractKit.prototype.getNetworkConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token1, token2, promises, contracts, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.registry.addressFor(base_1.CeloContract.GoldToken)];
                    case 1:
                        token1 = _a.sent();
                        return [4 /*yield*/, this.registry.addressFor(base_1.CeloContract.StableToken)
                            // There can only be `10` unique parametrized types in Promise.all call, that is how
                            // its typescript typing is setup. Thus, since we crossed threshold of 10
                            // have to explicitly cast it to just any type and discard type information.
                        ];
                    case 2:
                        token2 = _a.sent();
                        promises = [
                            this.contracts.getExchange(),
                            this.contracts.getElection(),
                            this.contracts.getAttestations(),
                            this.contracts.getGovernance(),
                            this.contracts.getLockedGold(),
                            this.contracts.getSortedOracles(),
                            this.contracts.getGasPriceMinimum(),
                            this.contracts.getReserve(),
                            this.contracts.getStableToken(),
                            this.contracts.getValidators(),
                            this.contracts.getDowntimeSlasher(),
                        ];
                        return [4 /*yield*/, Promise.all(promises)];
                    case 3:
                        contracts = _a.sent();
                        return [4 /*yield*/, Promise.all([
                                contracts[0].getConfig(),
                                contracts[1].getConfig(),
                                contracts[2].getConfig([token1, token2]),
                                contracts[3].getConfig(),
                                contracts[4].getConfig(),
                                contracts[5].getConfig(),
                                contracts[6].getConfig(),
                                contracts[7].getConfig(),
                                contracts[8].getConfig(),
                                contracts[9].getConfig(),
                                contracts[10].getConfig(),
                            ])];
                    case 4:
                        res = _a.sent();
                        return [2 /*return*/, {
                                exchange: res[0],
                                election: res[1],
                                attestations: res[2],
                                governance: res[3],
                                lockedGold: res[4],
                                sortedOracles: res[5],
                                gasPriceMinimum: res[6],
                                reserve: res[7],
                                stableToken: res[8],
                                validators: res[9],
                                downtimeSlasher: res[10],
                            }];
                }
            });
        });
    };
    /**
     * Set CeloToken to use to pay for gas fees
     * @param token cUSD (StableToken) or cGLD (GoldToken)
     */
    ContractKit.prototype.setFeeCurrency = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.config;
                        if (!(token === base_1.CeloContract.GoldToken)) return [3 /*break*/, 1];
                        _b = undefined;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.registry.addressFor(token)];
                    case 2:
                        _b = _c.sent();
                        _c.label = 3;
                    case 3:
                        _a.feeCurrency = _b;
                        return [2 /*return*/];
                }
            });
        });
    };
    ContractKit.prototype.addAccount = function (privateKey) {
        assertIsCeloProvider(this.web3.currentProvider);
        this.web3.currentProvider.addAccount(privateKey);
    };
    Object.defineProperty(ContractKit.prototype, "defaultAccount", {
        /**
         * Default account for generated transactions (eg. tx.from)
         */
        get: function () {
            var account = this.web3.eth.defaultAccount;
            return account ? account : undefined;
        },
        /**
         * Set default account for generated transactions (eg. tx.from )
         */
        set: function (address) {
            this.config.from = address;
            this.web3.eth.defaultAccount = address ? address : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ContractKit.prototype, "gasInflationFactor", {
        get: function () {
            return this.config.gasInflationFactor;
        },
        set: function (factor) {
            this.config.gasInflationFactor = factor;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ContractKit.prototype, "gasPrice", {
        get: function () {
            return parseInt(this.config.gasPrice, 10);
        },
        set: function (price) {
            this.config.gasPrice = price.toString(10);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ContractKit.prototype, "defaultFeeCurrency", {
        get: function () {
            return this.config.feeCurrency;
        },
        /**
         * Set the ERC20 address for the token to use to pay for transaction fees.
         * The ERC20 must be whitelisted for gas.
         *
         * Set to `null` to use cGLD
         *
         * @param address ERC20 address
         */
        set: function (address) {
            this.config.feeCurrency = address;
        },
        enumerable: true,
        configurable: true
    });
    ContractKit.prototype.isListening = function () {
        return this.web3.eth.net.isListening();
    };
    ContractKit.prototype.isSyncing = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.web3.eth
                .isSyncing()
                .then(function (response) {
                // isSyncing returns a syncProgress object when it's still syncing
                if (typeof response === 'boolean') {
                    resolve(response);
                }
                else {
                    resolve(true);
                }
            })
                .catch(reject);
        });
    };
    /**
     * Send a transaction to celo-blockchain.
     *
     * Similar to `web3.eth.sendTransaction()` but with following differences:
     *  - applies kit tx's defaults
     *  - estimatesGas before sending
     *  - returns a `TransactionResult` instead of `PromiEvent`
     */
    ContractKit.prototype.sendTransaction = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            var gas, _a, _b, e_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        tx = this.fillTxDefaults(tx);
                        gas = tx.gas;
                        if (!(gas == null)) return [3 /*break*/, 4];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        _b = (_a = Math).round;
                        return [4 /*yield*/, web3_utils_1.estimateGas(tx, this.web3.eth.estimateGas, this.web3.eth.call)];
                    case 2:
                        gas = _b.apply(_a, [(_c.sent()) *
                                this.config.gasInflationFactor]);
                        debug('estimatedGas: %s', gas);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _c.sent();
                        throw new Error(e_1);
                    case 4: return [2 /*return*/, tx_result_1.toTxResult(this.web3.eth.sendTransaction(__assign(__assign({}, tx), { gas: gas })))];
                }
            });
        });
    };
    ContractKit.prototype.sendTransactionObject = function (txObj, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var gas, gasEstimator, getCallTx_1, caller, _a, _b, e_2;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        tx = this.fillTxDefaults(tx);
                        gas = tx.gas;
                        if (!(gas == null)) return [3 /*break*/, 4];
                        gasEstimator = function (_tx) { return txObj.estimateGas(__assign({}, _tx)); };
                        getCallTx_1 = function (_tx) {
                            // @ts-ignore missing _parent property from TransactionObject type.
                            return __assign(__assign({}, _tx), { data: txObj.encodeABI(), to: txObj._parent._address });
                        };
                        caller = function (_tx) { return _this.web3.eth.call(getCallTx_1(_tx)); };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        _b = (_a = Math).round;
                        return [4 /*yield*/, web3_utils_1.estimateGas(tx, gasEstimator, caller)];
                    case 2:
                        gas = _b.apply(_a, [(_c.sent()) * this.config.gasInflationFactor]);
                        debug('estimatedGas: %s', gas);
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _c.sent();
                        throw new Error(e_2);
                    case 4: return [2 /*return*/, tx_result_1.toTxResult(txObj.send(__assign(__assign({}, tx), { gas: gas })))];
                }
            });
        });
    };
    ContractKit.prototype.fillTxDefaults = function (tx) {
        var defaultTx = {
            from: this.config.from,
            feeCurrency: this.config.feeCurrency,
            gasPrice: this.config.gasPrice,
        };
        if (this.config.feeCurrency) {
            defaultTx.feeCurrency = this.config.feeCurrency;
        }
        return __assign(__assign({}, defaultTx), tx);
    };
    ContractKit.prototype.getFirstBlockNumberForEpoch = function (epochNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var validators, epochSize;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.getValidators()];
                    case 1:
                        validators = _a.sent();
                        return [4 /*yield*/, validators.getEpochSize()
                            // Follows GetEpochFirstBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
                        ];
                    case 2:
                        epochSize = _a.sent();
                        // Follows GetEpochFirstBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
                        if (epochNumber === 0) {
                            // No first block for epoch 0
                            return [2 /*return*/, 0];
                        }
                        return [2 /*return*/, (epochNumber - 1) * epochSize.toNumber() + 1];
                }
            });
        });
    };
    ContractKit.prototype.getLastBlockNumberForEpoch = function (epochNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var validators, epochSize, firstBlockNumberForEpoch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.getValidators()];
                    case 1:
                        validators = _a.sent();
                        return [4 /*yield*/, validators.getEpochSize()
                            // Follows GetEpochLastBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
                        ];
                    case 2:
                        epochSize = _a.sent();
                        // Follows GetEpochLastBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
                        if (epochNumber === 0) {
                            return [2 /*return*/, 0];
                        }
                        return [4 /*yield*/, this.getFirstBlockNumberForEpoch(epochNumber)];
                    case 3:
                        firstBlockNumberForEpoch = _a.sent();
                        return [2 /*return*/, firstBlockNumberForEpoch + (epochSize.toNumber() - 1)];
                }
            });
        });
    };
    ContractKit.prototype.getEpochNumberOfBlock = function (blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var validators, epochSize, epochNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.getValidators()];
                    case 1:
                        validators = _a.sent();
                        return [4 /*yield*/, validators.getEpochSize()];
                    case 2:
                        epochSize = (_a.sent()).toNumber();
                        epochNumber = Math.floor(blockNumber / epochSize);
                        if (blockNumber % epochSize === 0) {
                            return [2 /*return*/, epochNumber];
                        }
                        else {
                            return [2 /*return*/, epochNumber + 1];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ContractKit.prototype.stop = function () {
        assertIsCeloProvider(this.web3.currentProvider);
        this.web3.currentProvider.stop();
    };
    return ContractKit;
}());
exports.ContractKit = ContractKit;
//# sourceMappingURL=kit.js.map