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
var io_1 = require("@celo/utils/lib/io");
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var cross_fetch_1 = __importDefault(require("cross-fetch"));
var Either_1 = require("fp-ts/lib/Either");
var fs_1 = require("fs");
var t = __importStar(require("io-ts"));
var PathReporter_1 = require("io-ts/lib/PathReporter");
var claim_1 = require("./claims/claim");
var types_1 = require("./claims/types");
var types_2 = require("./claims/types");
exports.ClaimTypes = types_2.ClaimTypes;
var MetaType = t.type({
    address: io_1.AddressType,
    signature: io_1.SignatureType,
});
exports.IdentityMetadataType = t.type({
    claims: t.array(claim_1.ClaimType),
    meta: MetaType,
});
var IdentityMetadataWrapper = /** @class */ (function () {
    function IdentityMetadataWrapper(data) {
        this.data = data;
    }
    IdentityMetadataWrapper.fromEmpty = function (address) {
        return new IdentityMetadataWrapper({
            claims: [],
            meta: {
                address: address,
                signature: '',
            },
        });
    };
    IdentityMetadataWrapper.fetchFromURL = function (kit, url) {
        return __awaiter(this, void 0, void 0, function () {
            var resp, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, cross_fetch_1.default(url)];
                    case 1:
                        resp = _c.sent();
                        if (!resp.ok) {
                            throw new Error("Request failed with status " + resp.status);
                        }
                        _a = this.fromRawString;
                        _b = [kit];
                        return [4 /*yield*/, resp.text()];
                    case 2: return [2 /*return*/, _a.apply(this, _b.concat([_c.sent()]))];
                }
            });
        });
    };
    IdentityMetadataWrapper.fromFile = function (kit, path) {
        return this.fromRawString(kit, fs_1.readFileSync(path, 'utf-8'));
    };
    IdentityMetadataWrapper.verifySigner = function (kit, hash, signature, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.verifySignerForAddress(kit, hash, signature, metadata.address)];
            });
        });
    };
    IdentityMetadataWrapper.verifySignerForAddress = function (kit, hash, signature, address) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, signers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!signatureUtils_1.verifySignature(hash, signature, address)) return [3 /*break*/, 5];
                        return [4 /*yield*/, kit.contracts.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [4 /*yield*/, accounts.isAccount(address)];
                    case 2:
                        if (!_a.sent()) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.all([
                                accounts.getVoteSigner(address),
                                accounts.getValidatorSigner(address),
                                accounts.getAttestationSigner(address),
                            ])];
                    case 3:
                        signers = _a.sent();
                        return [2 /*return*/, signers.some(function (signer) { return signatureUtils_1.verifySignature(hash, signature, signer); })];
                    case 4: return [2 /*return*/, false];
                    case 5: return [2 /*return*/, true];
                }
            });
        });
    };
    IdentityMetadataWrapper.fromRawString = function (kit, rawData) {
        return __awaiter(this, void 0, void 0, function () {
            var data, validatedData, claims, hash, _a, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        data = JSON.parse(rawData);
                        validatedData = exports.IdentityMetadataType.decode(data);
                        if (Either_1.isLeft(validatedData)) {
                            // TODO: We could probably return a more useful error in the future
                            throw new Error(PathReporter_1.PathReporter.report(validatedData).join(', '));
                        }
                        claims = validatedData.right.claims;
                        hash = claim_1.hashOfClaims(claims);
                        _a = claims.length > 0;
                        if (!_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.verifySigner(kit, hash, validatedData.right.meta.signature, validatedData.right.meta)];
                    case 1:
                        _a = !(_b.sent());
                        _b.label = 2;
                    case 2:
                        if (_a) {
                            throw new Error("Signature could not be validated. Guessing signer: " + signatureUtils_1.guessSigner(hash, validatedData.right.meta.signature));
                        }
                        res = new IdentityMetadataWrapper(validatedData.right);
                        // Verify that singular claim types appear at most once
                        types_1.SINGULAR_CLAIM_TYPES.forEach(function (claimType) {
                            var results = res.filterClaims(claimType);
                            if (results.length > 1) {
                                throw new Error("Found " + results.length + " claims of type " + claimType + ", should be at most 1");
                            }
                        });
                        return [2 /*return*/, res];
                }
            });
        });
    };
    Object.defineProperty(IdentityMetadataWrapper.prototype, "claims", {
        get: function () {
            return this.data.claims;
        },
        enumerable: true,
        configurable: true
    });
    IdentityMetadataWrapper.prototype.hashOfClaims = function () {
        return claim_1.hashOfClaims(this.data.claims);
    };
    IdentityMetadataWrapper.prototype.toString = function () {
        return JSON.stringify({
            claims: this.data.claims,
            meta: this.data.meta,
        });
    };
    IdentityMetadataWrapper.prototype.addClaim = function (claim, signer) {
        return __awaiter(this, void 0, void 0, function () {
            var existingClaims, existingClaims, index, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        switch (claim.type) {
                            case types_1.ClaimTypes.ACCOUNT:
                                if (address_1.eqAddress(claim.address, this.data.meta.address)) {
                                    throw new Error("Can't claim self");
                                }
                                break;
                            case types_1.ClaimTypes.DOMAIN: {
                                existingClaims = this.data.claims.filter(function (el) { return el.domain === claim.domain; });
                                if (existingClaims.length > 0) {
                                    return [2 /*return*/, existingClaims[0]];
                                }
                                break;
                            }
                            case types_1.ClaimTypes.KEYBASE: {
                                existingClaims = this.data.claims.filter(function (el) { return el.username === claim.username; });
                                if (existingClaims.length > 0) {
                                    return [2 /*return*/, existingClaims[0]];
                                }
                            }
                            default:
                                break;
                        }
                        if (types_1.SINGULAR_CLAIM_TYPES.includes(claim.type)) {
                            index = this.data.claims.findIndex(claim_1.isOfType(claim.type));
                            if (index !== -1) {
                                this.data.claims.splice(index, 1);
                            }
                        }
                        this.data.claims.push(claim);
                        _a = this.data.meta;
                        return [4 /*yield*/, signer.sign(this.hashOfClaims())];
                    case 1:
                        _a.signature = _b.sent();
                        return [2 /*return*/, claim];
                }
            });
        });
    };
    IdentityMetadataWrapper.prototype.findClaim = function (type) {
        return this.data.claims.find(claim_1.isOfType(type));
    };
    IdentityMetadataWrapper.prototype.filterClaims = function (type) {
        return this.data.claims.filter(claim_1.isOfType(type));
    };
    return IdentityMetadataWrapper;
}());
exports.IdentityMetadataWrapper = IdentityMetadataWrapper;
//# sourceMappingURL=metadata.js.map