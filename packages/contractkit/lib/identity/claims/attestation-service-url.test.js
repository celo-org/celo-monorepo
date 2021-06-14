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
var ganache_setup_1 = require("@celo/dev-utils/lib/ganache-setup");
var ganache_test_1 = require("@celo/dev-utils/lib/ganache-test");
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var kit_1 = require("../../kit");
var metadata_1 = require("../metadata");
var attestation_service_url_1 = require("./attestation-service-url");
ganache_test_1.testWithGanache('AttestationServiceURL claims', function (web3) {
    var kit = kit_1.newKitFromWeb3(web3);
    var url = 'https://example.com';
    var address = ganache_setup_1.ACCOUNT_ADDRESSES[0];
    it('can make a claim', function () { return __awaiter(void 0, void 0, void 0, function () {
        var metadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metadata = metadata_1.IdentityMetadataWrapper.fromEmpty(address);
                    return [4 /*yield*/, metadata.addClaim(attestation_service_url_1.createAttestationServiceURLClaim(url), signatureUtils_1.NativeSigner(kit.web3.eth.sign, address))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('can overwrite the existing claim', function () { return __awaiter(void 0, void 0, void 0, function () {
        var metadata, newUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metadata = metadata_1.IdentityMetadataWrapper.fromEmpty(address);
                    return [4 /*yield*/, metadata.addClaim(attestation_service_url_1.createAttestationServiceURLClaim(url), signatureUtils_1.NativeSigner(kit.web3.eth.sign, address))];
                case 1:
                    _a.sent();
                    newUrl = 'https://example.com/new';
                    return [4 /*yield*/, metadata.addClaim(attestation_service_url_1.createAttestationServiceURLClaim(newUrl), signatureUtils_1.NativeSigner(kit.web3.eth.sign, address))];
                case 2:
                    _a.sent();
                    expect(metadata.claims).toHaveLength(1);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=attestation-service-url.test.js.map