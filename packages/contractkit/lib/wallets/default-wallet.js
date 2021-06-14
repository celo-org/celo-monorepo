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
var DefaultWallet = /** @class */ (function () {
    function DefaultWallet() {
        // Account addresses are hex-encoded, lower case alphabets
        this.privateKeys = new Map();
    }
    DefaultWallet.prototype.addAccount = function (privateKey) {
        // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
        privateKey = address_1.normalizeAddressWith0x(privateKey);
        var accountAddress = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(privateKey));
        if (this.privateKeys.has(accountAddress)) {
            return;
        }
        this.privateKeys.set(accountAddress, privateKey);
    };
    DefaultWallet.prototype.getAccounts = function () {
        return Array.from(this.privateKeys.keys());
    };
    DefaultWallet.prototype.hasAccount = function (address) {
        if (address) {
            return this.privateKeys.has(address_1.normalizeAddressWith0x(address));
        }
        else {
            return false;
        }
    };
    DefaultWallet.prototype.signTransaction = function (txParams) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, signing_utils_1.signTransaction(txParams, this.getPrivateKeyFor(txParams.from.toString()))];
            });
        });
    };
    // Original code taken from
    // https://github.com/0xProject/0x-monorepo/blob/78c704e3d/packages/subproviders/src/subproviders/private_key_wallet.ts
    /**
     * Sign a personal Ethereum signed message.
     * The address must be provided it must match the address calculated from the private key.
     * @param address Address of the account to sign with
     * @param data Hex string message to sign
     * @return Signature hex string (order: rsv)
     */
    DefaultWallet.prototype.signPersonalMessage = function (address, data) {
        return __awaiter(this, void 0, void 0, function () {
            var pk, pkBuffer, dataBuff, msgHashBuff, sig, rpcSig;
            return __generator(this, function (_a) {
                if (!address_1.isHexString(data)) {
                    throw Error('default-wallet@signPersonalMessage: Expected data has to be an Hex String ');
                }
                pk = address_1.trimLeading0x(this.getPrivateKeyFor(address));
                pkBuffer = Buffer.from(pk, 'hex');
                dataBuff = ethUtil.toBuffer(data);
                msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
                sig = ethUtil.ecsign(msgHashBuff, pkBuffer);
                rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
                return [2 /*return*/, rpcSig];
            });
        });
    };
    // Original code taken from
    // https://github.com/0xProject/0x-monorepo/blob/78c704e3d/packages/subproviders/src/subproviders/private_key_wallet.ts
    /**
     * Sign an EIP712 Typed Data message. The signing address will be calculated from the private key.
     * The address must be provided it must match the address calculated from the private key.
     * @param address Address of the account to sign with
     * @param data the typed data object
     * @return Signature hex string (order: rsv)
     */
    DefaultWallet.prototype.signTypedData = function (address, typedData) {
        return __awaiter(this, void 0, void 0, function () {
            var pk, pkBuffer, dataBuff, sig, rpcSig;
            return __generator(this, function (_a) {
                if (typedData === undefined) {
                    throw Error('default-wallet@signTypedData: TypedData Missing');
                }
                pk = address_1.trimLeading0x(this.getPrivateKeyFor(address));
                pkBuffer = Buffer.from(pk, 'hex');
                dataBuff = sign_typed_data_utils_1.generateTypedDataHash(typedData);
                sig = ethUtil.ecsign(dataBuff, pkBuffer);
                rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
                return [2 /*return*/, rpcSig];
            });
        });
    };
    DefaultWallet.prototype.getPrivateKeyFor = function (account) {
        if (account) {
            var maybePk = this.privateKeys.get(address_1.normalizeAddressWith0x(account));
            if (maybePk != null) {
                return maybePk;
            }
        }
        throw Error("default-wallet@getPrivateKeyFor: Private key not found for " + account);
    };
    return DefaultWallet;
}());
exports.DefaultWallet = DefaultWallet;
//# sourceMappingURL=default-wallet.js.map