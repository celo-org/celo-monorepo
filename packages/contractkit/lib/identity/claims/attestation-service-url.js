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
var t = __importStar(require("io-ts"));
var types_1 = require("./types");
var SIGNATURE_PREFIX = 'attestation-service-status-signature:';
exports.AttestationServiceURLClaimType = t.type({
    type: t.literal(types_1.ClaimTypes.ATTESTATION_SERVICE_URL),
    timestamp: types_1.TimestampType,
    url: io_1.UrlType,
});
exports.createAttestationServiceURLClaim = function (url) { return ({
    url: url,
    timestamp: types_1.now(),
    type: types_1.ClaimTypes.ATTESTATION_SERVICE_URL,
}); };
function validateAttestationServiceUrl(kit, claim, address) {
    return __awaiter(this, void 0, void 0, function () {
        var randomMessage, url, resp, jsonResp, parsedResponse, claimedAccountAddress, accounts, attestationKeyAddress, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    randomMessage = kit.web3.utils.randomHex(32);
                    url = claim.url + '/status?messageToSign=' + randomMessage;
                    return [4 /*yield*/, cross_fetch_1.default(url)];
                case 1:
                    resp = _a.sent();
                    if (!resp.ok) {
                        return [2 /*return*/, "Could not request sucessfully from " + url + "\", received status " + resp.status];
                    }
                    return [4 /*yield*/, resp.json()];
                case 2:
                    jsonResp = _a.sent();
                    parsedResponse = io_1.AttestationServiceStatusResponseType.decode(jsonResp);
                    if (Either_1.isLeft(parsedResponse)) {
                        return [2 /*return*/, "Response from " + url + " could not be parsed successfully"];
                    }
                    claimedAccountAddress = parsedResponse.right.accountAddress;
                    if (!address_1.eqAddress(claimedAccountAddress, address)) {
                        return [2 /*return*/, "The service claims " + claimedAccountAddress + ", but metadata claims " + address];
                    }
                    return [4 /*yield*/, kit.contracts.getAccounts()];
                case 3:
                    accounts = _a.sent();
                    return [4 /*yield*/, accounts.getAttestationSigner(address)];
                case 4:
                    attestationKeyAddress = _a.sent();
                    if (attestationKeyAddress === '0x0' || address_1.eqAddress(address, attestationKeyAddress)) {
                        return [2 /*return*/, "The account has not specified a separate attestation key"];
                    }
                    if (!parsedResponse.right.signature ||
                        !signatureUtils_1.verifySignature(SIGNATURE_PREFIX + randomMessage, parsedResponse.right.signature, attestationKeyAddress)) {
                        return [2 /*return*/, "The service's attestation key differs from the smart contract registered one"];
                    }
                    return [2 /*return*/];
                case 5:
                    error_1 = _a.sent();
                    return [2 /*return*/, "Could not validate attestation service claim: " + error_1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.validateAttestationServiceUrl = validateAttestationServiceUrl;
//# sourceMappingURL=attestation-service-url.js.map