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
var _01_ecrecover_1 = require("./01-ecrecover");
var _02_sha256_1 = require("./02-sha256");
var _03_ripemd160_1 = require("./03-ripemd160");
var _04_identity_1 = require("./04-identity");
var _05_modexp_1 = require("./05-modexp");
var _06_ecadd_1 = require("./06-ecadd");
var _07_ecmul_1 = require("./07-ecmul");
var _08_ecpairing_1 = require("./08-ecpairing");
var _09_blake2f_1 = require("./09-blake2f");
var f8_epochsize_1 = require("./f8-epochsize");
var fc_fractionmulexp_1 = require("./fc-fractionmulexp");
var fd_transfer_1 = require("./fd-transfer");
function toAsync(a) {
    return function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, a(opts)];
            });
        });
    };
}
var ripemdPrecompileAddress = '0000000000000000000000000000000000000003';
exports.ripemdPrecompileAddress = ripemdPrecompileAddress;
var precompiles = (_a = {
        '0000000000000000000000000000000000000001': toAsync(_01_ecrecover_1.default),
        '0000000000000000000000000000000000000002': toAsync(_02_sha256_1.default)
    },
    _a[ripemdPrecompileAddress] = toAsync(_03_ripemd160_1.default),
    _a['0000000000000000000000000000000000000004'] = toAsync(_04_identity_1.default),
    _a['0000000000000000000000000000000000000005'] = toAsync(_05_modexp_1.default),
    _a['0000000000000000000000000000000000000006'] = toAsync(_06_ecadd_1.default),
    _a['0000000000000000000000000000000000000007'] = toAsync(_07_ecmul_1.default),
    _a['0000000000000000000000000000000000000008'] = toAsync(_08_ecpairing_1.default),
    _a['0000000000000000000000000000000000000009'] = toAsync(_09_blake2f_1.default),
    _a['00000000000000000000000000000000000000f8'] = toAsync(f8_epochsize_1.default),
    _a['00000000000000000000000000000000000000fc'] = toAsync(fc_fractionmulexp_1.default),
    _a['00000000000000000000000000000000000000fd'] = fd_transfer_1.default,
    _a);
exports.precompiles = precompiles;
function getPrecompile(address) {
    return precompiles[address];
}
exports.getPrecompile = getPrecompile;
//# sourceMappingURL=index.js.map