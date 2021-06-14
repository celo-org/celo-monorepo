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
var ethUtil = __importStar(require("ethereumjs-util"));
var signing_utils_1 = require("../../utils/signing-utils");
/**
 * Signs the EVM transaction using an HSM key in Azure Key Vault
 */
var AzureHSMSigner = /** @class */ (function () {
    function AzureHSMSigner(keyVaultClient, keyName) {
        if (!AzureHSMSigner.keyVaultClient) {
            AzureHSMSigner.keyVaultClient = keyVaultClient;
        }
        this.keyName = keyName;
    }
    AzureHSMSigner.prototype.signTransaction = function (addToV, encodedTx) {
        return __awaiter(this, void 0, void 0, function () {
            var hash, bufferedMessage, signature, sigV;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hash = signing_utils_1.getHashFromEncoded(encodedTx.rlpEncode);
                        bufferedMessage = Buffer.from(address_1.trimLeading0x(hash), 'hex');
                        return [4 /*yield*/, AzureHSMSigner.keyVaultClient.signMessage(bufferedMessage, this.keyName)];
                    case 1:
                        signature = _a.sent();
                        sigV = addToV + signature.v;
                        return [2 /*return*/, {
                                v: sigV,
                                r: signature.r,
                                s: signature.s,
                            }];
                }
            });
        });
    };
    AzureHSMSigner.prototype.signPersonalMessage = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var dataBuff, msgHashBuff, signature, sigV;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dataBuff = ethUtil.toBuffer(address_1.ensureLeading0x(data));
                        msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
                        return [4 /*yield*/, AzureHSMSigner.keyVaultClient.signMessage(Buffer.from(msgHashBuff), this.keyName)
                            // Recovery ID should be a byte prefix
                            // https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v
                        ];
                    case 1:
                        signature = _a.sent();
                        sigV = signature.v + 27;
                        return [2 /*return*/, {
                                v: sigV,
                                r: signature.r,
                                s: signature.s,
                            }];
                }
            });
        });
    };
    AzureHSMSigner.prototype.getNativeKey = function () {
        return this.keyName;
    };
    return AzureHSMSigner;
}());
exports.AzureHSMSigner = AzureHSMSigner;
//# sourceMappingURL=azure-hsm-signer.js.map