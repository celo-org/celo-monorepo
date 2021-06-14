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
var proxy_1 = require("../governance/proxy");
var web3_utils_1 = require("../utils/web3-utils");
var base_1 = require("./base");
function newBlockExplorer(kit) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = BlockExplorer.bind;
                    _b = [void 0, kit];
                    return [4 /*yield*/, base_1.obtainKitContractDetails(kit)];
                case 1: return [2 /*return*/, new (_a.apply(BlockExplorer, _b.concat([_c.sent()])))()];
            }
        });
    });
}
exports.newBlockExplorer = newBlockExplorer;
var BlockExplorer = /** @class */ (function () {
    function BlockExplorer(kit, contractDetails) {
        this.kit = kit;
        this.contractDetails = contractDetails;
        this.addressMapping = base_1.mapFromPairs(contractDetails.map(function (cd) { return [
            cd.address,
            {
                details: cd,
                fnMapping: base_1.mapFromPairs(cd.jsonInterface.concat(proxy_1.PROXY_ABI)
                    .filter(function (ad) { return ad.type === 'function'; })
                    .map(function (ad) { return [ad.signature, ad]; })),
            },
        ]; }));
    }
    BlockExplorer.prototype.fetchBlockByHash = function (blockHash) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO fix typing: eth.getBlock support hashes and numbers
                return [2 /*return*/, this.kit.web3.eth.getBlock(blockHash, true)];
            });
        });
    };
    BlockExplorer.prototype.fetchBlock = function (blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.kit.web3.eth.getBlock(blockNumber, true)];
            });
        });
    };
    BlockExplorer.prototype.fetchBlockRange = function (from, to) {
        return __awaiter(this, void 0, void 0, function () {
            var results, i, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = [];
                        i = from;
                        _c.label = 1;
                    case 1:
                        if (!(i < to)) return [3 /*break*/, 4];
                        _b = (_a = results).push;
                        return [4 /*yield*/, this.fetchBlock(i)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    BlockExplorer.prototype.parseBlock = function (block) {
        var parsedTx = [];
        for (var _i = 0, _a = block.transactions; _i < _a.length; _i++) {
            var tx = _a[_i];
            if (typeof tx !== 'string') {
                var maybeKnownCall = this.tryParseTx(tx);
                if (maybeKnownCall != null) {
                    parsedTx.push(maybeKnownCall);
                }
            }
        }
        return {
            block: block,
            parsedTx: parsedTx,
        };
    };
    BlockExplorer.prototype.tryParseTx = function (tx) {
        var callDetails = this.tryParseTxInput(tx.to, tx.input);
        if (!callDetails) {
            return null;
        }
        return {
            tx: tx,
            callDetails: callDetails,
        };
    };
    BlockExplorer.prototype.tryParseTxInput = function (address, input) {
        var contractMapping = this.addressMapping.get(address);
        if (contractMapping == null) {
            return null;
        }
        var callSignature = input.slice(0, 10);
        var encodedParameters = input.slice(10);
        var matchedAbi = contractMapping.fnMapping.get(callSignature);
        if (matchedAbi == null) {
            return null;
        }
        var _a = web3_utils_1.parseDecodedParams(web3_eth_abi_1.default.decodeParameters(matchedAbi.inputs, encodedParameters)), args = _a.args, params = _a.params;
        return {
            contract: contractMapping.details.name,
            function: matchedAbi.name,
            paramMap: params,
            argList: args,
        };
    };
    return BlockExplorer;
}());
exports.BlockExplorer = BlockExplorer;
//# sourceMappingURL=block-explorer.js.map