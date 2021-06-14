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
var address_1 = require("@celo/utils/lib/address");
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var kit_1 = require("../../kit");
var metadata_1 = require("../metadata");
var account_1 = require("./account");
var verify_1 = require("./verify");
ganache_test_1.testWithGanache('Account claims', function (web3) {
    var kit = kit_1.newKitFromWeb3(web3);
    var address = ganache_setup_1.ACCOUNT_ADDRESSES[0];
    var otherAddress = ganache_setup_1.ACCOUNT_ADDRESSES[1];
    it('can make an account claim', function () { return __awaiter(void 0, void 0, void 0, function () {
        var metadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metadata = metadata_1.IdentityMetadataWrapper.fromEmpty(address);
                    return [4 /*yield*/, metadata.addClaim(account_1.createAccountClaim(otherAddress), signatureUtils_1.NativeSigner(kit.web3.eth.sign, address))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('can make an account claim with the public key', function () { return __awaiter(void 0, void 0, void 0, function () {
        var metadata, otherKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metadata = metadata_1.IdentityMetadataWrapper.fromEmpty(address);
                    otherKey = ganache_setup_1.ACCOUNT_PRIVATE_KEYS[1];
                    return [4 /*yield*/, metadata.addClaim(account_1.createAccountClaim(address_1.privateKeyToAddress(otherKey), address_1.privateKeyToPublicKey(otherKey)), signatureUtils_1.NativeSigner(kit.web3.eth.sign, address))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("can't claim itself", function () { return __awaiter(void 0, void 0, void 0, function () {
        var metadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metadata = metadata_1.IdentityMetadataWrapper.fromEmpty(address);
                    return [4 /*yield*/, expect(metadata.addClaim(account_1.createAccountClaim(address), signatureUtils_1.NativeSigner(kit.web3.eth.sign, address))).rejects.toEqual(new Error("Can't claim self"))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('fails to create a claim with in invalid address', function () {
        expect(function () {
            account_1.createAccountClaim('notanaddress');
        }).toThrow();
    });
    it('fails when passing a public key that is derived from a different private key', function () { return __awaiter(void 0, void 0, void 0, function () {
        var key1, key2;
        return __generator(this, function (_a) {
            key1 = ganache_setup_1.ACCOUNT_PRIVATE_KEYS[0];
            key2 = ganache_setup_1.ACCOUNT_PRIVATE_KEYS[1];
            expect(function () {
                return account_1.createAccountClaim(address_1.privateKeyToAddress(key1), address_1.privateKeyToPublicKey(key2));
            }).toThrow();
            return [2 /*return*/];
        });
    }); });
    describe('verifying', function () {
        var claim;
        var otherMetadata;
        // Mocking static function calls was too difficult, so manually mocking it
        var originalFetchFromURLImplementation = metadata_1.IdentityMetadataWrapper.fetchFromURL;
        beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
            var myUrl, accounts, metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        otherMetadata = metadata_1.IdentityMetadataWrapper.fromEmpty(otherAddress);
                        myUrl = 'https://www.test.com/';
                        return [4 /*yield*/, kit.contracts.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [4 /*yield*/, accounts.createAccount().send({ from: address })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, accounts.setMetadataURL(myUrl).send({ from: address })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, accounts.createAccount().send({ from: otherAddress })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, accounts.setMetadataURL(myUrl).send({ from: otherAddress })];
                    case 5:
                        _a.sent();
                        metadata_1.IdentityMetadataWrapper.fetchFromURL = function () { return Promise.resolve(otherMetadata); };
                        metadata = metadata_1.IdentityMetadataWrapper.fromEmpty(address);
                        claim = account_1.createAccountClaim(otherAddress);
                        return [4 /*yield*/, metadata.addClaim(claim, signatureUtils_1.NativeSigner(kit.web3.eth.sign, address))];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        afterEach(function () {
            metadata_1.IdentityMetadataWrapper.fetchFromURL = originalFetchFromURLImplementation;
        });
        describe('when the metadata URL of the other account has not been set', function () {
            beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, kit.contracts.getAccounts()];
                        case 1: return [4 /*yield*/, (_a.sent()).setMetadataURL('').send({ from: otherAddress })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('indicates that the metadata url could not be retrieved', function () { return __awaiter(void 0, void 0, void 0, function () {
                var error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, verify_1.verifyClaim(kit, claim, address)];
                        case 1:
                            error = _a.sent();
                            expect(error).toContain('could not be retrieved');
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('when the metadata URL is set, but does not contain the address claim', function () {
            it('indicates that the metadata does not contain the counter claim', function () { return __awaiter(void 0, void 0, void 0, function () {
                var error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, verify_1.verifyClaim(kit, claim, address)];
                        case 1:
                            error = _a.sent();
                            expect(error).toContain('did not claim');
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('when the other account correctly counter-claims', function () {
            beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, otherMetadata.addClaim(account_1.createAccountClaim(address), signatureUtils_1.NativeSigner(kit.web3.eth.sign, otherAddress))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            it('returns undefined succesfully', function () { return __awaiter(void 0, void 0, void 0, function () {
                var error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, verify_1.verifyClaim(kit, claim, address)];
                        case 1:
                            error = _a.sent();
                            expect(error).toBeUndefined();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=account.test.js.map