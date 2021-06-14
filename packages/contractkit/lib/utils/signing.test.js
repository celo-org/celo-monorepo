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
// This only really tests signatureUtils in @celo/utils, but is tested here
// to avoid the web3/ganache setup in @celo/utils
ganache_test_1.testWithGanache('Signing', function (web3) {
    var account = ganache_setup_1.ACCOUNT_ADDRESSES[0];
    var pKey = ganache_setup_1.ACCOUNT_PRIVATE_KEYS[0];
    var nativeSigner = signatureUtils_1.NativeSigner(web3.eth.sign, account);
    var localSigner = signatureUtils_1.LocalSigner(pKey);
    it('signs a message the same way via RPC and with an explicit private key', function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, nativeSignature, localSignature;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = 'message';
                    return [4 /*yield*/, nativeSigner.sign(message)];
                case 1:
                    nativeSignature = _a.sent();
                    return [4 /*yield*/, localSigner.sign(message)];
                case 2:
                    localSignature = _a.sent();
                    expect(signatureUtils_1.parseSignature(message, nativeSignature, account)).toEqual(signatureUtils_1.parseSignature(message, localSignature, account));
                    return [2 /*return*/];
            }
        });
    }); });
    it('signs a message that was hashed the same way via RPC and with an explicit private key', function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, nativeSignature, localSignature;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = web3.utils.soliditySha3('message');
                    return [4 /*yield*/, nativeSigner.sign(message)];
                case 1:
                    nativeSignature = _a.sent();
                    return [4 /*yield*/, localSigner.sign(message)];
                case 2:
                    localSignature = _a.sent();
                    expect(signatureUtils_1.parseSignature(message, nativeSignature, account)).toEqual(signatureUtils_1.parseSignature(message, localSignature, account));
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=signing.test.js.map