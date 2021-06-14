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
var address_1 = require("@celo/utils/lib/address");
var io_1 = require("@celo/utils/lib/io");
var dns_1 = require("dns");
var util_1 = require("util");
var metadata_1 = require("../metadata");
var claim_1 = require("./claim");
var keybase_1 = require("./keybase");
var types_1 = require("./types");
/**
 * Verifies a claim made by an account, i.e. whether a claim can be verified to be correct
 * @param kit ContractKit object
 * @param claim The claim to verify
 * @param address The address that is making the claim
 * @returns If valid, returns undefined. If invalid or unable to verify, returns a string with the error
 */
function verifyClaim(kit, claim, address) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (claim.type) {
                case types_1.ClaimTypes.KEYBASE:
                    return [2 /*return*/, keybase_1.verifyKeybaseClaim(kit, claim, address)];
                case types_1.ClaimTypes.ACCOUNT:
                    return [2 /*return*/, exports.verifyAccountClaim(kit, claim, address)];
                case types_1.ClaimTypes.DOMAIN:
                    return [2 /*return*/, exports.verifyDomainRecord(kit, claim, address)];
                default:
                    break;
            }
            return [2 /*return*/];
        });
    });
}
exports.verifyClaim = verifyClaim;
exports.verifyAccountClaim = function (kit, claim, address) { return __awaiter(void 0, void 0, void 0, function () {
    var metadataURL, metadata, error_1, accountClaims;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, kit.contracts.getAccounts()];
            case 1: return [4 /*yield*/, (_a.sent()).getMetadataURL(claim.address)];
            case 2:
                metadataURL = _a.sent();
                if (!io_1.isValidUrl(metadataURL)) {
                    return [2 /*return*/, "Metadata URL of " + claim.address + " could not be retrieved"];
                }
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, metadata_1.IdentityMetadataWrapper.fetchFromURL(kit, metadataURL)];
            case 4:
                metadata = _a.sent();
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                return [2 /*return*/, "Metadata could not be fetched for " + claim.address + " at " + metadataURL + ": " + error_1.toString()];
            case 6:
                accountClaims = metadata.filterClaims(types_1.ClaimTypes.ACCOUNT);
                if (accountClaims.find(function (x) { return address_1.eqAddress(x.address, address); }) === undefined) {
                    return [2 /*return*/, claim.address + " did not claim " + address];
                }
                return [2 /*return*/];
        }
    });
}); };
/**
 * It verifies if a DNS domain includes in the TXT records an entry with name
 * `celo-site-verification` and a valid signature in base64
 */
exports.verifyDomainRecord = function (kit, claim, address, dnsResolver) {
    if (dnsResolver === void 0) { dnsResolver = dns_1.resolveTxt; }
    return __awaiter(void 0, void 0, void 0, function () {
        var getRecords, domainRecords, _i, domainRecords_1, record, _a, record_1, entry, signatureBase64, signature, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 8, , 9]);
                    getRecords = util_1.promisify(dnsResolver);
                    return [4 /*yield*/, getRecords(claim.domain)];
                case 1:
                    domainRecords = _b.sent();
                    _i = 0, domainRecords_1 = domainRecords;
                    _b.label = 2;
                case 2:
                    if (!(_i < domainRecords_1.length)) return [3 /*break*/, 7];
                    record = domainRecords_1[_i];
                    _a = 0, record_1 = record;
                    _b.label = 3;
                case 3:
                    if (!(_a < record_1.length)) return [3 /*break*/, 6];
                    entry = record_1[_a];
                    if (!entry.startsWith(claim_1.DOMAIN_TXT_HEADER)) return [3 /*break*/, 5];
                    signatureBase64 = entry.substring(claim_1.DOMAIN_TXT_HEADER.length + 1);
                    signature = Buffer.from(signatureBase64, 'base64').toString('binary');
                    return [4 /*yield*/, metadata_1.IdentityMetadataWrapper.verifySignerForAddress(kit, claim_1.serializeClaim(claim), signature, address)];
                case 4:
                    if (_b.sent()) {
                        return [2 /*return*/];
                    }
                    _b.label = 5;
                case 5:
                    _a++;
                    return [3 /*break*/, 3];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/, "Unable to verify domain claim with address " + address];
                case 8:
                    error_2 = _b.sent();
                    return [2 /*return*/, "Unable to fetch domain TXT records: " + error_2.toString()];
                case 9: return [2 /*return*/];
            }
        });
    });
};
//# sourceMappingURL=verify.js.map