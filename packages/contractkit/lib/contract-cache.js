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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var base_1 = require("./base");
var Accounts_1 = require("./wrappers/Accounts");
var Attestations_1 = require("./wrappers/Attestations");
var BlockchainParameters_1 = require("./wrappers/BlockchainParameters");
var DoubleSigningSlasher_1 = require("./wrappers/DoubleSigningSlasher");
var DowntimeSlasher_1 = require("./wrappers/DowntimeSlasher");
var Election_1 = require("./wrappers/Election");
// import { EpochRewardsWrapper } from './wrappers/EpochRewards'
var Escrow_1 = require("./wrappers/Escrow");
var Exchange_1 = require("./wrappers/Exchange");
var Freezer_1 = require("./wrappers/Freezer");
var GasPriceMinimum_1 = require("./wrappers/GasPriceMinimum");
var GoldTokenWrapper_1 = require("./wrappers/GoldTokenWrapper");
var Governance_1 = require("./wrappers/Governance");
var LockedGold_1 = require("./wrappers/LockedGold");
var MultiSig_1 = require("./wrappers/MultiSig");
var Reserve_1 = require("./wrappers/Reserve");
var SortedOracles_1 = require("./wrappers/SortedOracles");
var StableTokenWrapper_1 = require("./wrappers/StableTokenWrapper");
var Validators_1 = require("./wrappers/Validators");
var WrapperFactories = (_a = {},
    _a[base_1.CeloContract.Accounts] = Accounts_1.AccountsWrapper,
    _a[base_1.CeloContract.Attestations] = Attestations_1.AttestationsWrapper,
    _a[base_1.CeloContract.BlockchainParameters] = BlockchainParameters_1.BlockchainParametersWrapper,
    _a[base_1.CeloContract.DoubleSigningSlasher] = DoubleSigningSlasher_1.DoubleSigningSlasherWrapper,
    _a[base_1.CeloContract.DowntimeSlasher] = DowntimeSlasher_1.DowntimeSlasherWrapper,
    _a[base_1.CeloContract.Election] = Election_1.ElectionWrapper,
    // [CeloContract.EpochRewards]?: EpochRewardsWrapper,
    _a[base_1.CeloContract.Escrow] = Escrow_1.EscrowWrapper,
    _a[base_1.CeloContract.Exchange] = Exchange_1.ExchangeWrapper,
    // [CeloContract.FeeCurrencyWhitelist]: FeeCurrencyWhitelistWrapper,
    _a[base_1.CeloContract.Freezer] = Freezer_1.FreezerWrapper,
    _a[base_1.CeloContract.GasPriceMinimum] = GasPriceMinimum_1.GasPriceMinimumWrapper,
    _a[base_1.CeloContract.GoldToken] = GoldTokenWrapper_1.GoldTokenWrapper,
    _a[base_1.CeloContract.Governance] = Governance_1.GovernanceWrapper,
    _a[base_1.CeloContract.LockedGold] = LockedGold_1.LockedGoldWrapper,
    // [CeloContract.Random]: RandomWrapper,
    // [CeloContract.Registry]: RegistryWrapper,
    _a[base_1.CeloContract.MultiSig] = MultiSig_1.MultiSigWrapper,
    _a[base_1.CeloContract.Reserve] = Reserve_1.ReserveWrapper,
    _a[base_1.CeloContract.SortedOracles] = SortedOracles_1.SortedOraclesWrapper,
    _a[base_1.CeloContract.StableToken] = StableTokenWrapper_1.StableTokenWrapper,
    _a[base_1.CeloContract.Validators] = Validators_1.ValidatorsWrapper,
    _a);
/**
 * Kit ContractWrappers factory & cache.
 *
 * Provides access to all contract wrappers for celo core contracts
 */
var WrapperCache = /** @class */ (function () {
    function WrapperCache(kit) {
        this.kit = kit;
        // private wrapperCache: Map<CeloContract, any> = new Map()
        this.wrapperCache = {};
    }
    WrapperCache.prototype.getAccounts = function () {
        return this.getContract(base_1.CeloContract.Accounts);
    };
    WrapperCache.prototype.getAttestations = function () {
        return this.getContract(base_1.CeloContract.Attestations);
    };
    WrapperCache.prototype.getBlockchainParameters = function () {
        return this.getContract(base_1.CeloContract.BlockchainParameters);
    };
    WrapperCache.prototype.getDoubleSigningSlasher = function () {
        return this.getContract(base_1.CeloContract.DoubleSigningSlasher);
    };
    WrapperCache.prototype.getDowntimeSlasher = function () {
        return this.getContract(base_1.CeloContract.DowntimeSlasher);
    };
    WrapperCache.prototype.getElection = function () {
        return this.getContract(base_1.CeloContract.Election);
    };
    // getEpochRewards() {
    //   return this.getContract(CeloContract.EpochRewards)
    // }
    WrapperCache.prototype.getEscrow = function () {
        return this.getContract(base_1.CeloContract.Escrow);
    };
    WrapperCache.prototype.getExchange = function () {
        return this.getContract(base_1.CeloContract.Exchange);
    };
    WrapperCache.prototype.getFreezer = function () {
        return this.getContract(base_1.CeloContract.Freezer);
    };
    // getFeeCurrencyWhitelist() {
    //   return this.getWrapper(CeloContract.FeeCurrencyWhitelist, newFeeCurrencyWhitelist)
    // }
    WrapperCache.prototype.getGasPriceMinimum = function () {
        return this.getContract(base_1.CeloContract.GasPriceMinimum);
    };
    WrapperCache.prototype.getGoldToken = function () {
        return this.getContract(base_1.CeloContract.GoldToken);
    };
    WrapperCache.prototype.getGovernance = function () {
        return this.getContract(base_1.CeloContract.Governance);
    };
    WrapperCache.prototype.getLockedGold = function () {
        return this.getContract(base_1.CeloContract.LockedGold);
    };
    WrapperCache.prototype.getMultiSig = function (address) {
        return this.getContract(base_1.CeloContract.MultiSig, address);
    };
    // getRegistry() {
    //   return this.getWrapper(CeloContract.Registry, newRegistry)
    // }
    WrapperCache.prototype.getReserve = function () {
        return this.getContract(base_1.CeloContract.Reserve);
    };
    WrapperCache.prototype.getSortedOracles = function () {
        return this.getContract(base_1.CeloContract.SortedOracles);
    };
    WrapperCache.prototype.getStableToken = function () {
        return this.getContract(base_1.CeloContract.StableToken);
    };
    WrapperCache.prototype.getValidators = function () {
        return this.getContract(base_1.CeloContract.Validators);
    };
    /**
     * Get Contract wrapper
     */
    WrapperCache.prototype.getContract = function (contract, address) {
        return __awaiter(this, void 0, void 0, function () {
            var instance, Klass;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.wrapperCache[contract] == null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.kit._web3Contracts.getContract(contract, address)];
                    case 1:
                        instance = _a.sent();
                        Klass = WrapperFactories[contract];
                        this.wrapperCache[contract] = new Klass(this.kit, instance);
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.wrapperCache[contract]];
                }
            });
        });
    };
    return WrapperCache;
}());
exports.WrapperCache = WrapperCache;
//# sourceMappingURL=contract-cache.js.map