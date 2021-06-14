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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var account_1 = require("@celo/utils/lib/account");
var errors_1 = require("@ledgerhq/errors");
var hw_app_eth_1 = __importDefault(require("@ledgerhq/hw-app-eth"));
var debug_1 = __importDefault(require("debug"));
var ledger_utils_1 = require("../utils/ledger-utils");
var remote_wallet_1 = require("./remote-wallet");
var ledger_signer_1 = require("./signers/ledger-signer");
exports.CELO_BASE_DERIVATION_PATH = account_1.CELO_DERIVATION_PATH_BASE.slice(2);
var ADDRESS_QTY = 5;
// Validates an address using the Ledger
var AddressValidation;
(function (AddressValidation) {
    // Validates every address required only when the ledger is initialized
    AddressValidation[AddressValidation["initializationOnly"] = 0] = "initializationOnly";
    // Validates the address every time a transaction is made
    AddressValidation[AddressValidation["everyTransaction"] = 1] = "everyTransaction";
    // Validates the address the first time a transaction is made for that specific address
    AddressValidation[AddressValidation["firstTransactionPerAddress"] = 2] = "firstTransactionPerAddress";
    // Never validates the addresses
    AddressValidation[AddressValidation["never"] = 3] = "never";
})(AddressValidation = exports.AddressValidation || (exports.AddressValidation = {}));
function newLedgerWalletWithSetup(transport, derivationPathIndexes, baseDerivationPath, ledgerAddressValidation) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    wallet = new LedgerWallet(derivationPathIndexes, baseDerivationPath, transport, ledgerAddressValidation);
                    return [4 /*yield*/, wallet.init()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, wallet];
            }
        });
    });
}
exports.newLedgerWalletWithSetup = newLedgerWalletWithSetup;
var debug = debug_1.default('kit:wallet:ledger');
var LedgerWallet = /** @class */ (function (_super) {
    __extends(LedgerWallet, _super);
    /**
     * @param derivationPathIndexes number array of "address_index" for the base derivation path.
     * Default: Array[0..9].
     * Example: [3, 99, 53] will retrieve the derivation paths of
     * [`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`]
     * @param baseDerivationPath base derivation path. Default: "44'/52752'/0'/0"
     * @param transport Transport to connect the ledger device
     */
    function LedgerWallet(derivationPathIndexes, baseDerivationPath, transport, ledgerAddressValidation) {
        if (derivationPathIndexes === void 0) { derivationPathIndexes = Array.from(Array(ADDRESS_QTY).keys()); }
        if (baseDerivationPath === void 0) { baseDerivationPath = exports.CELO_BASE_DERIVATION_PATH; }
        if (transport === void 0) { transport = {}; }
        if (ledgerAddressValidation === void 0) { ledgerAddressValidation = AddressValidation.firstTransactionPerAddress; }
        var _this = _super.call(this) || this;
        _this.derivationPathIndexes = derivationPathIndexes;
        _this.baseDerivationPath = baseDerivationPath;
        _this.transport = transport;
        _this.ledgerAddressValidation = ledgerAddressValidation;
        var invalidDPs = derivationPathIndexes.some(function (value) { return !(Number.isInteger(value) && value >= 0); });
        if (invalidDPs) {
            throw new Error('ledger-wallet: Invalid address index');
        }
        return _this;
    }
    LedgerWallet.prototype.loadAccountSigners = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addressToSigner, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.ledger) {
                            this.ledger = this.generateNewLedger(this.transport);
                        }
                        debug('Fetching addresses from the ledger');
                        addressToSigner = new Map();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.retrieveAccounts()];
                    case 2:
                        addressToSigner = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_1.TransportStatusError || error_1 instanceof errors_1.TransportError) {
                            ledger_utils_1.transportErrorFriendlyMessage(error_1);
                        }
                        throw error_1;
                    case 4: return [2 /*return*/, addressToSigner];
                }
            });
        });
    };
    // Extracted for testing purpose
    LedgerWallet.prototype.generateNewLedger = function (transport) {
        return new hw_app_eth_1.default(transport);
    };
    LedgerWallet.prototype.retrieveAccounts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addressToSigner, appConfiguration, validationRequired, _i, _a, value, derivationPath, addressInfo;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        addressToSigner = new Map();
                        return [4 /*yield*/, this.retrieveAppConfiguration()];
                    case 1:
                        appConfiguration = _b.sent();
                        validationRequired = this.ledgerAddressValidation === AddressValidation.initializationOnly;
                        _i = 0, _a = this.derivationPathIndexes;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        value = _a[_i];
                        derivationPath = this.baseDerivationPath + "/" + value;
                        return [4 /*yield*/, this.ledger.getAddress(derivationPath, validationRequired)];
                    case 3:
                        addressInfo = _b.sent();
                        addressToSigner.set(addressInfo.address, new ledger_signer_1.LedgerSigner(this.ledger, derivationPath, this.ledgerAddressValidation, appConfiguration));
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, addressToSigner];
                }
            });
        });
    };
    LedgerWallet.prototype.retrieveAppConfiguration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var appConfiguration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ledger.getAppConfiguration()];
                    case 1:
                        appConfiguration = _a.sent();
                        if (!appConfiguration.arbitraryDataEnabled) {
                            console.warn('Beware, your ledger does not allow the use of contract data. Some features may not work correctly, including token transfers. You can enable it from the ledger app settings.');
                        }
                        return [2 /*return*/, appConfiguration];
                }
            });
        });
    };
    return LedgerWallet;
}(remote_wallet_1.RemoteWallet));
exports.LedgerWallet = LedgerWallet;
//# sourceMappingURL=ledger-wallet.js.map