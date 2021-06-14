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
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var web3_1 = __importDefault(require("web3"));
var base_1 = require("./base");
var Registry_1 = require("./generated/Registry");
var debug = debug_1.default('kit:registry');
// Registry contract is always predeployed to this address
var REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10';
/**
 * Celo Core Contract's Address Registry
 */
var AddressRegistry = /** @class */ (function () {
    function AddressRegistry(kit) {
        this.cache = new Map();
        this.cache.set(base_1.CeloContract.Registry, REGISTRY_CONTRACT_ADDRESS);
        this.registry = Registry_1.newRegistry(kit.web3, REGISTRY_CONTRACT_ADDRESS);
    }
    /**
     * Get the address for a `CeloContract`
     */
    AddressRegistry.prototype.addressFor = function (contract) {
        return __awaiter(this, void 0, void 0, function () {
            var proxyStrippedContract, hash, address, cachedAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.cache.has(contract)) return [3 /*break*/, 2];
                        proxyStrippedContract = contract.replace('Proxy', '');
                        debug('Fetching address from Registry for %s', contract);
                        hash = web3_1.default.utils.soliditySha3({ type: 'string', value: proxyStrippedContract });
                        return [4 /*yield*/, this.registry.methods.getAddressFor(hash).call()];
                    case 1:
                        address = _a.sent();
                        debug('Fetched address:  %s = %s', address);
                        if (!address || address === base_1.NULL_ADDRESS) {
                            throw new Error("Failed to get address for " + contract + " from the Registry");
                        }
                        this.cache.set(contract, address);
                        _a.label = 2;
                    case 2:
                        cachedAddress = this.cache.get(contract);
                        return [2 /*return*/, cachedAddress];
                }
            });
        });
    };
    /**
     * Get the address for all possible `CeloContract`
     */
    AddressRegistry.prototype.allAddresses = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, _i, AllContracts_1, contract, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        res = {};
                        _i = 0, AllContracts_1 = base_1.AllContracts;
                        _c.label = 1;
                    case 1:
                        if (!(_i < AllContracts_1.length)) return [3 /*break*/, 4];
                        contract = AllContracts_1[_i];
                        _a = res;
                        _b = contract;
                        return [4 /*yield*/, this.addressFor(contract)];
                    case 2:
                        _a[_b] = _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, res];
                }
            });
        });
    };
    return AddressRegistry;
}());
exports.AddressRegistry = AddressRegistry;
//# sourceMappingURL=address-registry.js.map