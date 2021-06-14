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
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var t = __importStar(require("io-ts"));
var account_1 = require("./account");
var attestation_service_url_1 = require("./attestation-service-url");
var types_1 = require("./types");
exports.KeybaseClaimType = t.type({
    type: t.literal(types_1.ClaimTypes.KEYBASE),
    timestamp: types_1.TimestampType,
    // TODO: Validate compliant username before just interpolating
    username: t.string,
});
var DomainClaimType = t.type({
    type: t.literal(types_1.ClaimTypes.DOMAIN),
    timestamp: types_1.TimestampType,
    domain: t.string,
});
var NameClaimType = t.type({
    type: t.literal(types_1.ClaimTypes.NAME),
    timestamp: types_1.TimestampType,
    name: t.string,
});
exports.ClaimType = t.union([
    attestation_service_url_1.AttestationServiceURLClaimType,
    account_1.AccountClaimType,
    DomainClaimType,
    exports.KeybaseClaimType,
    NameClaimType,
]);
exports.SignedClaimType = t.type({
    claim: exports.ClaimType,
    signature: types_1.SignatureType,
});
exports.DOMAIN_TXT_HEADER = 'celo-site-verification';
exports.isOfType = function (type) { return function (data) {
    return data.type === type;
}; };
/**
 * Validates a claim made by an account, i.e. whether the claim is usable
 * @param kit The ContractKit object
 * @param claim The claim to validate
 * @param address The address that is making the claim
 * @returns If valid, returns undefined. If invalid or unable to validate, returns a string with the error
 */
function validateClaim(kit, claim, address) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (claim.type) {
                case types_1.ClaimTypes.ATTESTATION_SERVICE_URL:
                    return [2 /*return*/, attestation_service_url_1.validateAttestationServiceUrl(kit, claim, address)];
                default:
                    break;
            }
            return [2 /*return*/];
        });
    });
}
exports.validateClaim = validateClaim;
function hashOfClaim(claim) {
    return signatureUtils_1.hashMessage(serializeClaim(claim));
}
exports.hashOfClaim = hashOfClaim;
function hashOfClaims(claims) {
    var hashes = claims.map(hashOfClaim);
    return signatureUtils_1.hashMessage(hashes.join(''));
}
exports.hashOfClaims = hashOfClaims;
function serializeClaim(claim) {
    return JSON.stringify(claim);
}
exports.serializeClaim = serializeClaim;
exports.createNameClaim = function (name) { return ({
    name: name,
    timestamp: types_1.now(),
    type: types_1.ClaimTypes.NAME,
}); };
exports.createDomainClaim = function (domain) { return ({
    domain: domain,
    timestamp: types_1.now(),
    type: types_1.ClaimTypes.DOMAIN,
}); };
//# sourceMappingURL=claim.js.map