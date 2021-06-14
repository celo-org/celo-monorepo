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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var errors_1 = require("@ledgerhq/errors");
var debug_1 = __importDefault(require("debug"));
var ethUtil = __importStar(require("ethereumjs-util"));
var ledger_utils_1 = require("../../utils/ledger-utils");
var sign_typed_data_utils_1 = require("../../utils/sign-typed-data-utils");
var tokens_1 = require("../ledger-utils/tokens");
var ledger_wallet_1 = require("../ledger-wallet");
var debug = debug_1.default('kit:wallet:ledger');
var CELO_APP_ACCEPTS_CONTRACT_DATA_FROM_VERSION = '1.0.2';
/**
 * Signs the EVM transaction with a Ledger device
 */
var LedgerSigner = /** @class */ (function () {
    function LedgerSigner(ledger, derivationPath, ledgerAddressValidation, appConfiguration) {
        if (appConfiguration === void 0) { appConfiguration = {
            arbitraryDataEnabled: 0,
            version: '0.0.0',
        }; }
        this.validated = false;
        this.ledger = ledger;
        this.derivationPath = derivationPath;
        this.ledgerAddressValidation = ledgerAddressValidation;
        this.appConfiguration = appConfiguration;
    }
    LedgerSigner.prototype.getNativeKey = function () {
        return this.derivationPath;
    };
    LedgerSigner.prototype.signTransaction = function (addToV, encodedTx) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedDerivationPath, signature, rv, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getValidatedDerivationPath()];
                    case 1:
                        validatedDerivationPath = _a.sent();
                        return [4 /*yield*/, this.checkForKnownToken(encodedTx)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.ledger.signTransaction(validatedDerivationPath, address_1.trimLeading0x(encodedTx.rlpEncode) // the ledger requires the rlpEncode without the leading 0x
                            )
                            // EIP155 support. check/recalc signature v value.
                        ];
                    case 3:
                        signature = _a.sent();
                        rv = parseInt(signature.v, 16);
                        // tslint:disable-next-line: no-bitwise
                        if (rv !== addToV && (rv & addToV) !== rv) {
                            addToV += 1; // add signature v bit.
                        }
                        signature.v = addToV.toString(10);
                        return [2 /*return*/, {
                                v: signature.v,
                                r: ethUtil.toBuffer(address_1.ensureLeading0x(signature.r)),
                                s: ethUtil.toBuffer(address_1.ensureLeading0x(signature.s)),
                            }];
                    case 4:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_1.TransportStatusError) {
                            // The Ledger fails if it doesn't know the feeCurrency
                            if (error_1.statusCode === 27264 && error_1.statusText === 'INCORRECT_DATA') {
                                debug('Possible invalid feeCurrency field');
                                throw new Error('ledger-signer@singTransaction: Incorrect Data. Verify that the feeCurrency is a valid one');
                            }
                            else {
                                ledger_utils_1.transportErrorFriendlyMessage(error_1);
                            }
                        }
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    LedgerSigner.prototype.signPersonalMessage = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var signature, _a, _b, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        _b = (_a = this.ledger).signPersonalMessage;
                        return [4 /*yield*/, this.getValidatedDerivationPath()];
                    case 1: return [4 /*yield*/, _b.apply(_a, [_c.sent(),
                            address_1.trimLeading0x(data)])];
                    case 2:
                        signature = _c.sent();
                        return [2 /*return*/, {
                                v: signature.v,
                                r: ethUtil.toBuffer(address_1.ensureLeading0x(signature.r)),
                                s: ethUtil.toBuffer(address_1.ensureLeading0x(signature.s)),
                            }];
                    case 3:
                        error_2 = _c.sent();
                        if (error_2 instanceof errors_1.TransportStatusError) {
                            ledger_utils_1.transportErrorFriendlyMessage(error_2);
                        }
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LedgerSigner.prototype.signTypedData = function (typedData) {
        return __awaiter(this, void 0, void 0, function () {
            var dataBuff, trimmedData, sig, _a, _b, error_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        dataBuff = sign_typed_data_utils_1.generateTypedDataHash(typedData);
                        trimmedData = address_1.trimLeading0x(dataBuff.toString('hex'));
                        _b = (_a = this.ledger).signPersonalMessage;
                        return [4 /*yield*/, this.getValidatedDerivationPath()];
                    case 1: return [4 /*yield*/, _b.apply(_a, [_c.sent(),
                            trimmedData])];
                    case 2:
                        sig = _c.sent();
                        return [2 /*return*/, {
                                v: parseInt(sig.v, 10),
                                r: ethUtil.toBuffer(address_1.ensureLeading0x(sig.r)),
                                s: ethUtil.toBuffer(address_1.ensureLeading0x(sig.s)),
                            }];
                    case 3:
                        error_3 = _c.sent();
                        if (error_3 instanceof errors_1.TransportStatusError) {
                            ledger_utils_1.transportErrorFriendlyMessage(error_3);
                        }
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LedgerSigner.prototype.getValidatedDerivationPath = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.validationRequired()) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ledger.getAddress(this.derivationPath, true)];
                    case 1:
                        _a.sent();
                        this.validated = true;
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.derivationPath];
                }
            });
        });
    };
    LedgerSigner.prototype.validationRequired = function () {
        switch (this.ledgerAddressValidation) {
            case ledger_wallet_1.AddressValidation.never: {
                return false;
            }
            case ledger_wallet_1.AddressValidation.everyTransaction: {
                return true;
            }
            case ledger_wallet_1.AddressValidation.firstTransactionPerAddress: {
                return !this.validated;
            }
            case ledger_wallet_1.AddressValidation.initializationOnly: {
                // Already initialized, so no need to validate in this state
                return false;
            }
            default: {
                throw new Error('ledger-signer@validationRequired: invalid ledgerValidation value');
            }
        }
    };
    /**
     * Display ERC20 info on ledger if contract is well known
     * @param rlpEncoded Encoded transaction
     */
    LedgerSigner.prototype.checkForKnownToken = function (rlpEncoded) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenInfo, feeTokenInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(tokens_1.compareLedgerAppVersions(this.appConfiguration.version, CELO_APP_ACCEPTS_CONTRACT_DATA_FROM_VERSION) >= 0)) return [3 /*break*/, 4];
                        tokenInfo = tokens_1.tokenInfoByAddressAndChainId(rlpEncoded.transaction.to, rlpEncoded.transaction.chainId);
                        if (!tokenInfo) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ledger.provideERC20TokenInformation(tokenInfo)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!(rlpEncoded.transaction.feeCurrency && rlpEncoded.transaction.feeCurrency !== '0x')) return [3 /*break*/, 4];
                        feeTokenInfo = tokens_1.tokenInfoByAddressAndChainId(rlpEncoded.transaction.feeCurrency, rlpEncoded.transaction.chainId);
                        if (!feeTokenInfo) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ledger.provideERC20TokenInformation(feeTokenInfo)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return LedgerSigner;
}());
exports.LedgerSigner = LedgerSigner;
//# sourceMappingURL=ledger-signer.js.map