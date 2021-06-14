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
var web3_eth_abi_1 = __importDefault(require("web3-eth-abi"));
var base_1 = require("./base");
function newLogExplorer(kit) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = LogExplorer.bind;
                    _b = [void 0, kit];
                    return [4 /*yield*/, base_1.obtainKitContractDetails(kit)];
                case 1: return [2 /*return*/, new (_a.apply(LogExplorer, _b.concat([_c.sent()])))()];
            }
        });
    });
}
exports.newLogExplorer = newLogExplorer;
var LogExplorer = /** @class */ (function () {
    function LogExplorer(kit, contractDetails) {
        this.kit = kit;
        this.contractDetails = contractDetails;
        this.addressMapping = base_1.mapFromPairs(contractDetails.map(function (cd) { return [
            cd.address,
            {
                details: cd,
                logMapping: base_1.mapFromPairs(cd.jsonInterface
                    .filter(function (ad) { return ad.type === 'event'; })
                    .map(function (ad) { return [ad.signature, ad]; })),
            },
        ]; }));
        for (var _i = 0, contractDetails_1 = contractDetails; _i < contractDetails_1.length; _i++) {
            var cd = contractDetails_1[_i];
            var fnMapping = new Map();
            for (var _a = 0, _b = cd.jsonInterface; _a < _b.length; _a++) {
                var abiDef = _b[_a];
                if (abiDef.type === 'event') {
                    fnMapping.set(abiDef.signature, abiDef);
                }
            }
            this.addressMapping.set(cd.address, {
                details: cd,
                logMapping: fnMapping,
            });
        }
    }
    LogExplorer.prototype.fetchTxReceipt = function (txhash) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.kit.web3.eth.getTransactionReceipt(txhash)];
            });
        });
    };
    LogExplorer.prototype.getKnownLogs = function (tx) {
        var res = [];
        for (var _i = 0, _a = tx.logs || []; _i < _a.length; _i++) {
            var log = _a[_i];
            var event_1 = this.tryParseLog(log);
            if (event_1 != null) {
                res.push(event_1);
            }
        }
        return res;
    };
    LogExplorer.prototype.tryParseLog = function (log) {
        if (log.topics.length === 0) {
            return null;
        }
        var contractMapping = this.addressMapping.get(log.address);
        if (contractMapping == null) {
            return null;
        }
        var logSignature = log.topics[0];
        var matchedAbi = contractMapping.logMapping.get(logSignature);
        if (matchedAbi == null) {
            return null;
        }
        var returnValues = web3_eth_abi_1.default.decodeLog(matchedAbi.inputs || [], log.data || '', log.topics.slice(1));
        delete returnValues.__length__;
        Object.keys(returnValues).forEach(function (key) {
            if (Number.parseInt(key, 10) >= 0) {
                delete returnValues[key];
            }
        });
        var logEvent = {
            address: log.address,
            blockHash: log.blockHash,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex,
            transactionIndex: log.transactionIndex,
            transactionHash: log.transactionHash,
            returnValues: returnValues,
            event: matchedAbi.name,
            signature: logSignature,
            raw: {
                data: log.data || '',
                topics: log.topics || [],
            },
        };
        return logEvent;
    };
    return LogExplorer;
}());
exports.LogExplorer = LogExplorer;
//# sourceMappingURL=log-explorer.js.map