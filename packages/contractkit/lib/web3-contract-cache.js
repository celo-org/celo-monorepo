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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var base_1 = require("./base");
var Accounts_1 = require("./generated/Accounts");
var Attestations_1 = require("./generated/Attestations");
var BlockchainParameters_1 = require("./generated/BlockchainParameters");
var DoubleSigningSlasher_1 = require("./generated/DoubleSigningSlasher");
var DowntimeSlasher_1 = require("./generated/DowntimeSlasher");
var Election_1 = require("./generated/Election");
var EpochRewards_1 = require("./generated/EpochRewards");
var Escrow_1 = require("./generated/Escrow");
var Exchange_1 = require("./generated/Exchange");
var FeeCurrencyWhitelist_1 = require("./generated/FeeCurrencyWhitelist");
var Freezer_1 = require("./generated/Freezer");
var GasPriceMinimum_1 = require("./generated/GasPriceMinimum");
var GoldToken_1 = require("./generated/GoldToken");
var Governance_1 = require("./generated/Governance");
var LockedGold_1 = require("./generated/LockedGold");
var MultiSig_1 = require("./generated/MultiSig");
var Proxy_1 = require("./generated/Proxy");
var Random_1 = require("./generated/Random");
var Registry_1 = require("./generated/Registry");
var Reserve_1 = require("./generated/Reserve");
var SortedOracles_1 = require("./generated/SortedOracles");
var StableToken_1 = require("./generated/StableToken");
var TransferWhitelist_1 = require("./generated/TransferWhitelist");
var Validators_1 = require("./generated/Validators");
var debug = debug_1.default('kit:web3-contract-cache');
exports.ContractFactories = (_a = {},
    _a[base_1.CeloContract.Accounts] = Accounts_1.newAccounts,
    _a[base_1.CeloContract.Attestations] = Attestations_1.newAttestations,
    _a[base_1.CeloContract.BlockchainParameters] = BlockchainParameters_1.newBlockchainParameters,
    _a[base_1.CeloContract.DoubleSigningSlasher] = DoubleSigningSlasher_1.newDoubleSigningSlasher,
    _a[base_1.CeloContract.DowntimeSlasher] = DowntimeSlasher_1.newDowntimeSlasher,
    _a[base_1.CeloContract.Election] = Election_1.newElection,
    _a[base_1.CeloContract.EpochRewards] = EpochRewards_1.newEpochRewards,
    _a[base_1.CeloContract.Escrow] = Escrow_1.newEscrow,
    _a[base_1.CeloContract.Exchange] = Exchange_1.newExchange,
    _a[base_1.CeloContract.FeeCurrencyWhitelist] = FeeCurrencyWhitelist_1.newFeeCurrencyWhitelist,
    _a[base_1.CeloContract.Freezer] = Freezer_1.newFreezer,
    _a[base_1.CeloContract.GasPriceMinimum] = GasPriceMinimum_1.newGasPriceMinimum,
    _a[base_1.CeloContract.GoldToken] = GoldToken_1.newGoldToken,
    _a[base_1.CeloContract.Governance] = Governance_1.newGovernance,
    _a[base_1.CeloContract.LockedGold] = LockedGold_1.newLockedGold,
    _a[base_1.CeloContract.MultiSig] = MultiSig_1.newMultiSig,
    _a[base_1.CeloContract.Random] = Random_1.newRandom,
    _a[base_1.CeloContract.Registry] = Registry_1.newRegistry,
    _a[base_1.CeloContract.Reserve] = Reserve_1.newReserve,
    _a[base_1.CeloContract.SortedOracles] = SortedOracles_1.newSortedOracles,
    _a[base_1.CeloContract.StableToken] = StableToken_1.newStableToken,
    _a[base_1.CeloContract.TransferWhitelist] = TransferWhitelist_1.newTransferWhitelist,
    _a[base_1.CeloContract.Validators] = Validators_1.newValidators,
    _a);
/**
 * Native Web3 contracts factory and cache.
 *
 * Exposes accessors to all `CeloContract` web3 contracts.
 *
 * Mostly a private cache, kit users would normally use
 * a contract wrapper
 */
var Web3ContractCache = /** @class */ (function () {
    function Web3ContractCache(kit) {
        this.kit = kit;
        this.cacheMap = {};
    }
    Web3ContractCache.prototype.getAccounts = function () {
        return this.getContract(base_1.CeloContract.Accounts);
    };
    Web3ContractCache.prototype.getAttestations = function () {
        return this.getContract(base_1.CeloContract.Attestations);
    };
    Web3ContractCache.prototype.getBlockchainParameters = function () {
        return this.getContract(base_1.CeloContract.BlockchainParameters);
    };
    Web3ContractCache.prototype.getDoubleSigningSlasher = function () {
        return this.getContract(base_1.CeloContract.DoubleSigningSlasher);
    };
    Web3ContractCache.prototype.getDowntimeSlasher = function () {
        return this.getContract(base_1.CeloContract.DowntimeSlasher);
    };
    Web3ContractCache.prototype.getElection = function () {
        return this.getContract(base_1.CeloContract.Election);
    };
    Web3ContractCache.prototype.getEpochRewards = function () {
        return this.getContract(base_1.CeloContract.EpochRewards);
    };
    Web3ContractCache.prototype.getEscrow = function () {
        return this.getContract(base_1.CeloContract.Escrow);
    };
    Web3ContractCache.prototype.getExchange = function () {
        return this.getContract(base_1.CeloContract.Exchange);
    };
    Web3ContractCache.prototype.getFeeCurrencyWhitelist = function () {
        return this.getContract(base_1.CeloContract.FeeCurrencyWhitelist);
    };
    Web3ContractCache.prototype.getFreezer = function () {
        return this.getContract(base_1.CeloContract.Freezer);
    };
    Web3ContractCache.prototype.getGasPriceMinimum = function () {
        return this.getContract(base_1.CeloContract.GasPriceMinimum);
    };
    Web3ContractCache.prototype.getGoldToken = function () {
        return this.getContract(base_1.CeloContract.GoldToken);
    };
    Web3ContractCache.prototype.getGovernance = function () {
        return this.getContract(base_1.CeloContract.Governance);
    };
    Web3ContractCache.prototype.getLockedGold = function () {
        return this.getContract(base_1.CeloContract.LockedGold);
    };
    Web3ContractCache.prototype.getMultiSig = function (address) {
        return this.getContract(base_1.CeloContract.MultiSig, address);
    };
    Web3ContractCache.prototype.getRandom = function () {
        return this.getContract(base_1.CeloContract.Random);
    };
    Web3ContractCache.prototype.getRegistry = function () {
        return this.getContract(base_1.CeloContract.Registry);
    };
    Web3ContractCache.prototype.getReserve = function () {
        return this.getContract(base_1.CeloContract.Reserve);
    };
    Web3ContractCache.prototype.getSortedOracles = function () {
        return this.getContract(base_1.CeloContract.SortedOracles);
    };
    Web3ContractCache.prototype.getStableToken = function () {
        return this.getContract(base_1.CeloContract.StableToken);
    };
    Web3ContractCache.prototype.getTransferWhitelist = function () {
        return this.getContract(base_1.CeloContract.TransferWhitelist);
    };
    Web3ContractCache.prototype.getValidators = function () {
        return this.getContract(base_1.CeloContract.Validators);
    };
    /**
     * Get native web3 contract wrapper
     */
    Web3ContractCache.prototype.getContract = function (contract, address) {
        return __awaiter(this, void 0, void 0, function () {
            var createFn, _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!(this.cacheMap[contract] == null)) return [3 /*break*/, 4];
                        debug('Initiating contract %s', contract);
                        createFn = base_1.ProxyContracts.includes(contract)
                            ? Proxy_1.newProxy
                            : exports.ContractFactories[contract];
                        // @ts-ignore: Too compplex union type
                        _a = this.cacheMap;
                        _b = contract;
                        _c = createFn;
                        _d = [this.kit.web3];
                        if (!address) return [3 /*break*/, 1];
                        _e = address;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.kit.registry.addressFor(contract)];
                    case 2:
                        _e = _f.sent();
                        _f.label = 3;
                    case 3:
                        // @ts-ignore: Too compplex union type
                        _a[_b] = _c.apply(void 0, _d.concat([_e]));
                        _f.label = 4;
                    case 4: 
                    // we know it's defined (thus the !)
                    return [2 /*return*/, this.cacheMap[contract]];
                }
            });
        });
    };
    return Web3ContractCache;
}());
exports.Web3ContractCache = Web3ContractCache;
//# sourceMappingURL=web3-contract-cache.js.map