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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
// @ts-ignore-next-line
var eth_lib_1 = require("eth-lib");
var ethUtil = __importStar(require("ethereumjs-util"));
var signing_utils_1 = require("../../utils/signing-utils");
/**
 * Signs the EVM transaction using the provided private key
 */
var LocalSigner = /** @class */ (function () {
    function LocalSigner(privateKey) {
        this.privateKey = privateKey;
    }
    LocalSigner.prototype.getNativeKey = function () {
        return this.privateKey;
    };
    LocalSigner.prototype.signTransaction = function (addToV, encodedTx) {
        return __awaiter(this, void 0, void 0, function () {
            var hash, signature, _a, v, r, s;
            return __generator(this, function (_b) {
                hash = signing_utils_1.getHashFromEncoded(encodedTx.rlpEncode);
                signature = eth_lib_1.account.makeSigner(addToV)(hash, this.privateKey);
                _a = eth_lib_1.account.decodeSignature(signature), v = _a[0], r = _a[1], s = _a[2];
                return [2 /*return*/, {
                        v: parseInt(v, 16),
                        r: ethUtil.toBuffer(r),
                        s: ethUtil.toBuffer(s),
                    }];
            });
        });
    };
    LocalSigner.prototype.signPersonalMessage = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedKey, pkBuffer, dataBuff, msgHashBuff, sig;
            return __generator(this, function (_a) {
                trimmedKey = address_1.trimLeading0x(this.privateKey);
                pkBuffer = Buffer.from(trimmedKey, 'hex');
                dataBuff = ethUtil.toBuffer(address_1.ensureLeading0x(data));
                msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
                sig = ethUtil.ecsign(msgHashBuff, pkBuffer);
                return [2 /*return*/, {
                        v: parseInt(sig.v, 10),
                        r: Buffer.from(sig.r),
                        s: Buffer.from(sig.s),
                    }];
            });
        });
    };
    return LocalSigner;
}());
exports.LocalSigner = LocalSigner;
//# sourceMappingURL=local-signer.js.map