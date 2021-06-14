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
var sign_typed_data_utils_1 = require("../utils/sign-typed-data-utils");
var signing_utils_1 = require("../utils/signing-utils");
var WalletBase = /** @class */ (function () {
    function WalletBase() {
        // By creating the Signers in advance we can have a common pattern across wallets
        // Each implementation is responsible for populating this map through addSigner
        this.accountSigners = new Map();
    }
    /**
     * Gets a list of accounts that have been registered
     */
    WalletBase.prototype.getAccounts = function () {
        return Array.from(this.accountSigners.keys());
    };
    /**
     * Returns true if account has been registered
     * @param address Account to check
     */
    WalletBase.prototype.hasAccount = function (address) {
        if (address) {
            var normalizedAddress = address_1.normalizeAddressWith0x(address);
            return this.accountSigners.has(normalizedAddress);
        }
        else {
            return false;
        }
    };
    /**
     * Adds the account-signer set to the internal map
     * @param address Account address
     * @param signer Account signer
     */
    WalletBase.prototype.addSigner = function (address, signer) {
        var normalizedAddress = address_1.normalizeAddressWith0x(address);
        this.accountSigners.set(normalizedAddress, signer);
    };
    /**
     * Gets the signer based on the 'from' field in the tx body
     * @param txParams Transaction to sign
     */
    WalletBase.prototype.signTransaction = function (txParams) {
        return __awaiter(this, void 0, void 0, function () {
            var rlpEncoded, addToV, fromAddress, signer, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!txParams) {
                            throw new Error('No transaction object given!');
                        }
                        rlpEncoded = signing_utils_1.rlpEncodedTx(txParams);
                        addToV = signing_utils_1.chainIdTransformationForSigning(txParams.chainId);
                        fromAddress = txParams.from.toString();
                        signer = this.getSigner(fromAddress);
                        return [4 /*yield*/, signer.signTransaction(addToV, rlpEncoded)];
                    case 1:
                        signature = _a.sent();
                        return [2 /*return*/, signing_utils_1.encodeTransaction(rlpEncoded, signature)];
                }
            });
        });
    };
    /**
     * Sign a personal Ethereum signed message.
     * @param address Address of the account to sign with
     * @param data Hex string message to sign
     * @return Signature hex string (order: rsv)
     */
    WalletBase.prototype.signPersonalMessage = function (address, data) {
        return __awaiter(this, void 0, void 0, function () {
            var signer, sig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!address_1.isHexString(data)) {
                            throw Error('wallet@signPersonalMessage: Expected data has to be a hex string ');
                        }
                        signer = this.getSigner(address);
                        return [4 /*yield*/, signer.signPersonalMessage(data)];
                    case 1:
                        sig = _a.sent();
                        return [2 /*return*/, ethUtil.toRpcSig(sig.v, sig.r, sig.s)];
                }
            });
        });
    };
    /**
     * Sign an EIP712 Typed Data message.
     * @param address Address of the account to sign with
     * @param typedData the typed data object
     * @return Signature hex string (order: rsv)
     */
    WalletBase.prototype.signTypedData = function (address, typedData) {
        return __awaiter(this, void 0, void 0, function () {
            var dataBuff, trimmedData, signer, sig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typedData === undefined) {
                            throw Error('wallet@signTypedData: TypedData Missing');
                        }
                        dataBuff = sign_typed_data_utils_1.generateTypedDataHash(typedData);
                        trimmedData = dataBuff.toString('hex');
                        signer = this.getSigner(address);
                        return [4 /*yield*/, signer.signPersonalMessage(trimmedData)];
                    case 1:
                        sig = _a.sent();
                        return [2 /*return*/, ethUtil.toRpcSig(sig.v, sig.r, sig.s)];
                }
            });
        });
    };
    WalletBase.prototype.getSigner = function (address) {
        var normalizedAddress = address_1.normalizeAddressWith0x(address);
        if (!this.accountSigners.has(normalizedAddress)) {
            throw new Error("Could not find address " + normalizedAddress);
        }
        return this.accountSigners.get(normalizedAddress);
    };
    return WalletBase;
}());
exports.WalletBase = WalletBase;
//# sourceMappingURL=wallet.js.map