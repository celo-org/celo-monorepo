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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
var address_1 = require("@celo/base/lib/address");
var registry_utils_1 = require("@celo/protocol/lib/registry-utils");
var web3_utils_1 = require("@celo/protocol/lib/web3-utils");
var migrationsConfig_1 = require("@celo/protocol/migrationsConfig");
var fixidity_1 = require("@celo/utils/lib/fixidity");
var truffle = require('@celo/protocol/truffle-config.js');
var initializeArgs = function () { return __awaiter(void 0, void 0, void 0, function () {
    var rate;
    return __generator(this, function (_a) {
        rate = fixidity_1.toFixed(migrationsConfig_1.config.stableToken.inflationRate);
        return [2 /*return*/, [
                migrationsConfig_1.config.stableToken.tokenName,
                migrationsConfig_1.config.stableToken.tokenSymbol,
                migrationsConfig_1.config.stableToken.decimals,
                migrationsConfig_1.config.registry.predeployedProxyAddress,
                rate.toString(),
                migrationsConfig_1.config.stableToken.inflationPeriod,
                migrationsConfig_1.config.stableToken.initialBalances.addresses,
                migrationsConfig_1.config.stableToken.initialBalances.values,
                'Exchange',
            ]];
    });
}); };
module.exports = web3_utils_1.deploymentForCoreContract(web3, artifacts, registry_utils_1.CeloContractName.StableToken, initializeArgs, function (stableToken, _web3, networkName) { return __awaiter(void 0, void 0, void 0, function () {
    var freezer, sortedOracles, _a, _b, oracle, e_1_1, goldPrice, fromAddress_1, isOracle, reserve, feeCurrencyWhitelist;
    var e_1, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!migrationsConfig_1.config.stableToken.frozen) return [3 /*break*/, 3];
                return [4 /*yield*/, web3_utils_1.getDeployedProxiedContract('Freezer', artifacts)];
            case 1:
                freezer = _d.sent();
                return [4 /*yield*/, freezer.freeze(stableToken.address)];
            case 2:
                _d.sent();
                _d.label = 3;
            case 3: return [4 /*yield*/, web3_utils_1.getDeployedProxiedContract('SortedOracles', artifacts)];
            case 4:
                sortedOracles = _d.sent();
                _d.label = 5;
            case 5:
                _d.trys.push([5, 10, 11, 12]);
                _a = __values(migrationsConfig_1.config.stableToken.oracles), _b = _a.next();
                _d.label = 6;
            case 6:
                if (!!_b.done) return [3 /*break*/, 9];
                oracle = _b.value;
                console.info("Adding " + oracle + " as an Oracle for StableToken (USD)");
                return [4 /*yield*/, sortedOracles.addOracle(stableToken.address, address_1.ensureLeading0x(oracle))];
            case 7:
                _d.sent();
                _d.label = 8;
            case 8:
                _b = _a.next();
                return [3 /*break*/, 6];
            case 9: return [3 /*break*/, 12];
            case 10:
                e_1_1 = _d.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 12];
            case 11:
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 12:
                goldPrice = migrationsConfig_1.config.stableToken.goldPrice;
                if (!goldPrice) return [3 /*break*/, 18];
                fromAddress_1 = truffle.networks[networkName].from;
                isOracle = migrationsConfig_1.config.stableToken.oracles.some(function (o) { return address_1.eqAddress(o, fromAddress_1); });
                if (!!isOracle) return [3 /*break*/, 14];
                console.warn("Gold price specified in migration but " + fromAddress_1 + " not explicitly authorized as oracle, authorizing...");
                return [4 /*yield*/, sortedOracles.addOracle(stableToken.address, address_1.ensureLeading0x(fromAddress_1))];
            case 13:
                _d.sent();
                _d.label = 14;
            case 14:
                console.info('Reporting price of StableToken (USD) to oracle');
                return [4 /*yield*/, sortedOracles.report(stableToken.address, fixidity_1.toFixed(goldPrice), address_1.NULL_ADDRESS, address_1.NULL_ADDRESS)];
            case 15:
                _d.sent();
                return [4 /*yield*/, web3_utils_1.getDeployedProxiedContract('Reserve', artifacts)];
            case 16:
                reserve = _d.sent();
                console.info('Adding StableToken (USD) to Reserve');
                return [4 /*yield*/, reserve.addToken(stableToken.address)];
            case 17:
                _d.sent();
                _d.label = 18;
            case 18:
                console.info('Whitelisting StableToken (USD) as a fee currency');
                return [4 /*yield*/, web3_utils_1.getDeployedProxiedContract('FeeCurrencyWhitelist', artifacts)];
            case 19:
                feeCurrencyWhitelist = _d.sent();
                return [4 /*yield*/, feeCurrencyWhitelist.addToken(stableToken.address)];
            case 20:
                _d.sent();
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=09_0_stabletoken_USD.js.map