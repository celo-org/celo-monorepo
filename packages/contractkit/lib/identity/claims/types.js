"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var t = __importStar(require("io-ts"));
exports.SignatureType = t.string;
exports.TimestampType = t.number;
exports.now = function () { return Math.round(new Date().getTime() / 1000); };
var ClaimTypes;
(function (ClaimTypes) {
    ClaimTypes["ATTESTATION_SERVICE_URL"] = "ATTESTATION_SERVICE_URL";
    ClaimTypes["ACCOUNT"] = "ACCOUNT";
    ClaimTypes["DOMAIN"] = "DOMAIN";
    ClaimTypes["KEYBASE"] = "KEYBASE";
    ClaimTypes["NAME"] = "NAME";
    ClaimTypes["PROFILE_PICTURE"] = "PROFILE_PICTURE";
    ClaimTypes["TWITTER"] = "TWITTER";
})(ClaimTypes = exports.ClaimTypes || (exports.ClaimTypes = {}));
exports.VERIFIABLE_CLAIM_TYPES = [ClaimTypes.KEYBASE, ClaimTypes.ACCOUNT, ClaimTypes.DOMAIN];
// Claims whose status can be validated
exports.VALIDATABLE_CLAIM_TYPES = [ClaimTypes.ATTESTATION_SERVICE_URL];
exports.SINGULAR_CLAIM_TYPES = [ClaimTypes.NAME, ClaimTypes.ATTESTATION_SERVICE_URL];
//# sourceMappingURL=types.js.map