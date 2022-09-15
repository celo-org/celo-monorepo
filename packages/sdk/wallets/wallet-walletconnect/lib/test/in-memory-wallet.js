"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestWallet = exports.testAddress = exports.testPrivateKey = void 0;
var contractkit_1 = require("@celo/contractkit");
var address_1 = require("@celo/utils/lib/address");
var client_1 = __importStar(require("@walletconnect/client"));
var utils_1 = require("@walletconnect/utils");
var debug_1 = __importDefault(require("debug"));
var types_1 = require("../types");
var common_1 = require("./common");
var debug = (0, debug_1.default)('in-memory-wallet');
var privateKey = '04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976';
var kit = (0, contractkit_1.newKit)('https://alfajores-forno.celo-testnet.org');
kit.addAccount(privateKey);
var wallet = kit.getWallet();
var _a = __read(wallet.getAccounts(), 1), account = _a[0];
exports.testPrivateKey = privateKey;
exports.testAddress = (0, address_1.toChecksumAddress)(account);
function getTestWallet() {
    var _this = this;
    var client;
    var sessionTopic;
    var pairingTopic;
    var onSessionProposal = function (proposal) {
        var response = {
            response: {
                metadata: {
                    name: 'Wallet',
                    description: 'A mobile payments wallet that works worldwide',
                    url: 'https://wallet.com',
                    icons: ['https://wallet.com/favicon.ico'],
                },
                state: {
                    accounts: [account + "@celo:44787"],
                },
            },
            proposal: proposal,
        };
        return client.approve(response);
    };
    var onSessionCreated = function (session) {
        sessionTopic = session.topic;
    };
    var onSessionUpdated = function (session) {
        debug('onSessionUpdated', session);
    };
    var onSessionDeleted = function (session) {
        debug('onSessionDeleted', session);
    };
    var onPairingProposal = function (pairing) {
        debug('onPairingProposal', pairing);
    };
    var onPairingCreated = function (pairing) {
        pairingTopic = pairing.topic;
    };
    var onPairingUpdated = function (pairing) {
        debug('onPairingUpdated', pairing);
    };
    var onPairingDeleted = function (pairing) {
        debug('onPairingDeleted', pairing);
    };
    function onSessionRequest(event) {
        return __awaiter(this, void 0, void 0, function () {
            var topic, _a, 
            // @ts-ignore
            id, method, 
            // @ts-ignore
            params, result, _b, payload, from, _c, from, payload, tx, _d, from, publicKey, _e, from, payload;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        topic = event.topic, _a = event.request, id = _a.id, method = _a.method, params = _a.params;
                        if (!(method === types_1.SupportedMethods.personalSign)) return [3 /*break*/, 2];
                        _b = (0, common_1.parsePersonalSign)(params), payload = _b.payload, from = _b.from;
                        return [4 /*yield*/, wallet.signPersonalMessage(from, payload)];
                    case 1:
                        result = _f.sent();
                        return [3 /*break*/, 11];
                    case 2:
                        if (!(method === types_1.SupportedMethods.signTypedData)) return [3 /*break*/, 4];
                        _c = (0, common_1.parseSignTypedData)(params), from = _c.from, payload = _c.payload;
                        return [4 /*yield*/, wallet.signTypedData(from, payload)];
                    case 3:
                        result = _f.sent();
                        return [3 /*break*/, 11];
                    case 4:
                        if (!(method === types_1.SupportedMethods.signTransaction)) return [3 /*break*/, 6];
                        tx = (0, common_1.parseSignTransaction)(params);
                        return [4 /*yield*/, wallet.signTransaction(tx)];
                    case 5:
                        result = _f.sent();
                        return [3 /*break*/, 11];
                    case 6:
                        if (!(method === types_1.SupportedMethods.computeSharedSecret)) return [3 /*break*/, 8];
                        _d = (0, common_1.parseComputeSharedSecret)(params), from = _d.from, publicKey = _d.publicKey;
                        return [4 /*yield*/, wallet.computeSharedSecret(from, publicKey)];
                    case 7:
                        result = (_f.sent()).toString('hex');
                        return [3 /*break*/, 11];
                    case 8:
                        if (!(method === types_1.SupportedMethods.decrypt)) return [3 /*break*/, 10];
                        _e = (0, common_1.parseDecrypt)(params), from = _e.from, payload = _e.payload;
                        return [4 /*yield*/, wallet.decrypt(from, payload)];
                    case 9:
                        result = (_f.sent()).toString('hex');
                        return [3 /*break*/, 11];
                    case 10:
                        // client.reject({})
                        // in memory wallet should always approve actions
                        debug('unknown method', method);
                        return [2 /*return*/];
                    case 11: return [2 /*return*/, client.respond({
                            topic: topic,
                            response: {
                                id: id,
                                jsonrpc: '2.0',
                                result: result,
                            },
                        })];
                }
            });
        });
    }
    return {
        init: function (uri) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, client_1.default.init({
                            relayProvider: process.env.WALLET_CONNECT_BRIDGE,
                            controller: true,
                            logger: 'error',
                        })];
                    case 1:
                        client = _a.sent();
                        client.on(client_1.CLIENT_EVENTS.session.proposal, onSessionProposal);
                        client.on(client_1.CLIENT_EVENTS.session.created, onSessionCreated);
                        client.on(client_1.CLIENT_EVENTS.session.updated, onSessionUpdated);
                        client.on(client_1.CLIENT_EVENTS.session.deleted, onSessionDeleted);
                        client.on(client_1.CLIENT_EVENTS.session.request, onSessionRequest);
                        client.on(client_1.CLIENT_EVENTS.pairing.proposal, onPairingProposal);
                        client.on(client_1.CLIENT_EVENTS.pairing.created, onPairingCreated);
                        client.on(client_1.CLIENT_EVENTS.pairing.updated, onPairingUpdated);
                        client.on(client_1.CLIENT_EVENTS.pairing.deleted, onPairingDeleted);
                        return [4 /*yield*/, client.pair({ uri: uri })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        close: function () {
            return __awaiter(this, void 0, void 0, function () {
                var reason;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            reason = utils_1.ERROR.USER_DISCONNECTED.format();
                            return [4 /*yield*/, client.disconnect({ topic: sessionTopic, reason: reason })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, client.pairing.delete({ topic: pairingTopic, reason: reason })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        },
    };
}
exports.getTestWallet = getTestWallet;
//# sourceMappingURL=in-memory-wallet.js.map