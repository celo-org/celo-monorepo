"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var client_1 = require("@walletconnect/client");
var events_1 = require("events");
var types_1 = require("../types");
var common_1 = require("./common");
var pairingTopic = 'XXX';
var MockWalletConnectClient = /** @class */ (function (_super) {
    __extends(MockWalletConnectClient, _super);
    function MockWalletConnectClient() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // tslint:disable-next-line
    MockWalletConnectClient.prototype.init = function () { };
    MockWalletConnectClient.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.emit(client_1.CLIENT_EVENTS.pairing.proposal, {
                    signal: {
                        params: {
                            uri: 'mockURI',
                        },
                    },
                });
                this.emit(client_1.CLIENT_EVENTS.pairing.created, {
                    topic: pairingTopic,
                    peer: {
                        metadata: {},
                        // tslint:disable-next-line
                        delete: function () { },
                    },
                });
                this.emit(client_1.CLIENT_EVENTS.session.created, {
                    topic: pairingTopic,
                    state: {
                        accounts: [common_1.testAddress + "@celo:44787"],
                    },
                });
                return [2 /*return*/];
            });
        });
    };
    MockWalletConnectClient.prototype.request = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, method, params, result, _b, payload, from, _c, from, payload, tx, _d, from, publicKey, _e, from, payload;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _a = event.request, method = _a.method, params = _a.params;
                        result = null;
                        if (!(method === types_1.SupportedMethods.personalSign)) return [3 /*break*/, 2];
                        _b = common_1.parsePersonalSign(params), payload = _b.payload, from = _b.from;
                        return [4 /*yield*/, common_1.testWallet.signPersonalMessage(from, payload)];
                    case 1:
                        result = _f.sent();
                        return [3 /*break*/, 11];
                    case 2:
                        if (!(method === types_1.SupportedMethods.signTypedData)) return [3 /*break*/, 4];
                        _c = common_1.parseSignTypedData(params), from = _c.from, payload = _c.payload;
                        return [4 /*yield*/, common_1.testWallet.signTypedData(from, payload)];
                    case 3:
                        result = _f.sent();
                        return [3 /*break*/, 11];
                    case 4:
                        if (!(method === types_1.SupportedMethods.signTransaction)) return [3 /*break*/, 6];
                        tx = common_1.parseSignTransaction(params);
                        return [4 /*yield*/, common_1.testWallet.signTransaction(tx)];
                    case 5:
                        result = _f.sent();
                        return [3 /*break*/, 11];
                    case 6:
                        if (!(method === types_1.SupportedMethods.computeSharedSecret)) return [3 /*break*/, 8];
                        _d = common_1.parseComputeSharedSecret(params), from = _d.from, publicKey = _d.publicKey;
                        return [4 /*yield*/, common_1.testWallet.computeSharedSecret(from, publicKey)];
                    case 7:
                        result = (_f.sent()).toString('hex');
                        return [3 /*break*/, 11];
                    case 8:
                        if (!(method === types_1.SupportedMethods.decrypt)) return [3 /*break*/, 10];
                        _e = common_1.parseDecrypt(params), from = _e.from, payload = _e.payload;
                        return [4 /*yield*/, common_1.testWallet.decrypt(from, payload)];
                    case 9:
                        result = (_f.sent()).toString('hex');
                        return [3 /*break*/, 11];
                    case 10: return [2 /*return*/];
                    case 11: return [2 /*return*/, result];
                }
            });
        });
    };
    // tslint:disable-next-line
    MockWalletConnectClient.prototype.disconnect = function () { };
    return MockWalletConnectClient;
}(events_1.EventEmitter));
exports.MockWalletConnectClient = MockWalletConnectClient;
//# sourceMappingURL=mock-client.js.map