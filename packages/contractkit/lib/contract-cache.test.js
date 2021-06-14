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
var _1 = require(".");
var contract_cache_1 = require("./contract-cache");
var TestedWrappers = [
    _1.CeloContract.GoldToken,
    _1.CeloContract.StableToken,
    _1.CeloContract.Exchange,
    _1.CeloContract.Validators,
    _1.CeloContract.LockedGold,
];
function newWrapperCache() {
    var kit = _1.newKit('http://localhost:8545');
    var AnyContractAddress = '0xe832065fb5117dbddcb566ff7dc4340999583e38';
    jest.spyOn(kit.registry, 'addressFor').mockResolvedValue(AnyContractAddress);
    var contractCache = new contract_cache_1.WrapperCache(kit);
    return contractCache;
}
describe('getContract()', function () {
    var contractCache = newWrapperCache();
    var _loop_1 = function (contractName) {
        test("SBAT get " + contractName, function () { return __awaiter(void 0, void 0, void 0, function () {
            var contract;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, contractCache.getContract(contractName)];
                    case 1:
                        contract = _a.sent();
                        expect(contract).not.toBeNull();
                        expect(contract).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    for (var _i = 0, TestedWrappers_1 = TestedWrappers; _i < TestedWrappers_1.length; _i++) {
        var contractName = TestedWrappers_1[_i];
        _loop_1(contractName);
    }
});
test('should cache contracts', function () { return __awaiter(void 0, void 0, void 0, function () {
    var contractCache, _i, TestedWrappers_2, contractName, contract, contractBis;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                contractCache = newWrapperCache();
                _i = 0, TestedWrappers_2 = TestedWrappers;
                _a.label = 1;
            case 1:
                if (!(_i < TestedWrappers_2.length)) return [3 /*break*/, 5];
                contractName = TestedWrappers_2[_i];
                return [4 /*yield*/, contractCache.getContract(contractName)];
            case 2:
                contract = _a.sent();
                return [4 /*yield*/, contractCache.getContract(contractName)];
            case 3:
                contractBis = _a.sent();
                expect(contract).toBe(contractBis);
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 1];
            case 5: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=contract-cache.test.js.map