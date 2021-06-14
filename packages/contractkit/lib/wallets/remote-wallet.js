"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var async_1 = require("@celo/utils/lib/async");
var wallet_1 = require("./wallet");
/**
 * Abstract class representing a remote wallet that requires async initialization
 */
var RemoteWallet = /** @class */ (function (_super) {
    __extends(RemoteWallet, _super);
    function RemoteWallet() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.setupFinished = false;
        _this.setupLocked = false;
        _this.INIT_TIMEOUT_IN_MS = 10 * 1000;
        return _this;
    }
    /**
     * Discovers wallet accounts and caches results in memory
     * Idempotent to ensure multiple calls are benign
     */
    RemoteWallet.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var accountSigners;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.setupLocked || this.setupFinished)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initCompleted()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        _a.trys.push([2, , 4, 5]);
                        this.setupLocked = true;
                        return [4 /*yield*/, this.loadAccountSigners()];
                    case 3:
                        accountSigners = _a.sent();
                        accountSigners.forEach(function (signer, address) {
                            _this.addSigner(address, signer);
                        });
                        this.setupFinished = true;
                        return [3 /*break*/, 5];
                    case 4:
                        this.setupLocked = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Monitor the initialization state until it reaches completion or time out
     */
    RemoteWallet.prototype.initCompleted = function () {
        return __awaiter(this, void 0, void 0, function () {
            var initTimeout, sleepIntervalInMs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        initTimeout = this.INIT_TIMEOUT_IN_MS;
                        sleepIntervalInMs = 1 * 1000;
                        _a.label = 1;
                    case 1:
                        if (!(initTimeout > 0)) return [3 /*break*/, 3];
                        initTimeout -= sleepIntervalInMs;
                        if (this.setupFinished) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, async_1.sleep(sleepIntervalInMs)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3: throw new Error('Initialization took too long. Ensure the wallet signer is available');
                }
            });
        });
    };
    /**
     * Get a list of accounts in the remote wallet
     */
    RemoteWallet.prototype.getAccounts = function () {
        this.initializationRequired();
        return _super.prototype.getAccounts.call(this);
    };
    /**
     * Returns true if account is in the remote wallet
     * @param address Account to check
     */
    RemoteWallet.prototype.hasAccount = function (address) {
        this.initializationRequired();
        return _super.prototype.hasAccount.call(this, address);
    };
    /**
     * Signs the EVM transaction using the signer pulled from the from field
     * @param txParams EVM transaction
     */
    RemoteWallet.prototype.signTransaction = function (txParams) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.initializationRequired();
                return [2 /*return*/, _super.prototype.signTransaction.call(this, txParams)];
            });
        });
    };
    /**
     * @param address Address of the account to sign with
     * @param data Hex string message to sign
     * @return Signature hex string (order: rsv)
     */
    RemoteWallet.prototype.signPersonalMessage = function (address, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.initializationRequired();
                return [2 /*return*/, _super.prototype.signPersonalMessage.call(this, address, data)];
            });
        });
    };
    /**
     * @param address Address of the account to sign with
     * @param typedData the typed data object
     * @return Signature hex string (order: rsv)
     */
    RemoteWallet.prototype.signTypedData = function (address, typedData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.initializationRequired();
                return [2 /*return*/, _super.prototype.signTypedData.call(this, address, typedData)];
            });
        });
    };
    RemoteWallet.prototype.initializationRequired = function () {
        if (!this.setupFinished) {
            throw new Error('wallet needs to be initialized first');
        }
    };
    return RemoteWallet;
}(wallet_1.WalletBase));
exports.RemoteWallet = RemoteWallet;
//# sourceMappingURL=remote-wallet.js.map