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
var crypto_1 = require("crypto");
var elliptic_1 = require("elliptic");
var dataEncryptionKey_1 = require("./dataEncryptionKey");
var ec = new elliptic_1.ec('secp256k1');
describe('deriveDek', function () {
    it('should produce a the expected keys', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mnemonic, _a, publicKey, privateKey;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mnemonic = 'language quiz proud sample canoe trend topic upper coil rack choice engage noodle panda mutual grab shallow thrive forget trophy pull pool mask height';
                    return [4 /*yield*/, dataEncryptionKey_1.deriveDek(mnemonic)];
                case 1:
                    _a = _b.sent(), publicKey = _a.publicKey, privateKey = _a.privateKey;
                    expect(publicKey).toBe('032e4027fc0a763a6651551f66ea50084b436cd7399564f9a05e916d2c37322a60');
                    expect(privateKey).toBe('d8428ba6a3a55e46d9b53cad26aca4a2be4c288e48a769f81c96a3ef1b391972');
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('decompressPublicKey', function () {
    it('should work with compressed input', function () {
        var privateKey = ec.keyFromPrivate(crypto_1.randomBytes(32));
        var publicKeyFull = Buffer.from(privateKey.getPublic(false, 'hex'), 'hex');
        var publicKeyCompressed = Buffer.from(privateKey.getPublic(true, 'hex'), 'hex');
        var decompressed = dataEncryptionKey_1.decompressPublicKey(publicKeyCompressed);
        expect(Buffer.concat([Buffer.from('04', 'hex'), decompressed])).toEqual(publicKeyFull);
        expect(decompressed).toHaveLength(64);
    });
    it('should work with long form input', function () {
        var privateKey = ec.keyFromPrivate(crypto_1.randomBytes(32));
        var publicKeyFull = Buffer.from(privateKey.getPublic(false, 'hex'), 'hex');
        var decompressed = dataEncryptionKey_1.decompressPublicKey(publicKeyFull);
        expect(Buffer.concat([Buffer.from('04', 'hex'), decompressed])).toEqual(publicKeyFull);
        expect(decompressed).toHaveLength(64);
    });
});
//# sourceMappingURL=dataEncryptionKey.test.js.map