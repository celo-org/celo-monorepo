"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletConnectWallet = void 0;
var base_1 = require("@celo/base");
var wallet_remote_1 = require("@celo/wallet-remote");
var client_1 = __importStar(require("@walletconnect/client"));
var utils_1 = require("@walletconnect/utils");
var debug_1 = __importDefault(require("debug"));
var constants_1 = require("./constants");
var types_1 = require("./types");
var utils_2 = require("./utils");
var wc_signer_1 = require("./wc-signer");
var debug = (0, debug_1.default)('kit:wallet:wallet-connect-wallet');
/**
 * Session establishment happens out of band so after somehow
 * communicating the connection URI (often via QR code) we can
 * continue with the setup process
 */
function waitForTruthy(getValue, attempts) {
    if (attempts === void 0) { attempts = 10; }
    return __awaiter(this, void 0, void 0, function () {
        var waitDuration, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    waitDuration = 500;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < attempts)) return [3 /*break*/, 4];
                    if (getValue()) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, base_1.sleep)(waitDuration)];
                case 2:
                    _a.sent();
                    waitDuration = waitDuration * 1.5;
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: throw new Error('Unable to get pairing session, did you lose internet connection?');
            }
        });
    });
}
var defaultInitOptions = {
    relayProvider: constants_1.endpoint,
};
var defaultConnectOptions = {
    metadata: {
        name: 'ContractKit',
        description: "Celo's ContractKit is a library to help developers and validators to interact with the celo-blockchain.",
        url: 'https://github.com/celo-org/celo-monorepo/tree/master/packages/sdk/contractkit',
        icons: [],
    },
    permissions: {
        blockchain: {
            // alfajores, mainnet, baklava
            chains: [
                'eip155:44787',
                'eip155:42220',
                'eip155:62320',
                // 'celo',
                // 'alfajores',
                // 'baklava',
            ],
        },
        jsonrpc: {
            methods: Object.values(types_1.SupportedMethods),
        },
    },
};
var WalletConnectWallet = /** @class */ (function (_super) {
    __extends(WalletConnectWallet, _super);
    function WalletConnectWallet(_a) {
        var init = _a.init, connect = _a.connect;
        var _this = _super.call(this) || this;
        _this.onSessionProposal = function (sessionProposal) {
            debug('onSessionProposal', sessionProposal);
        };
        _this.onSessionCreated = function (session) {
            debug('onSessionCreated', session);
            _this.session = session;
        };
        _this.onSessionUpdated = function (session) {
            debug('onSessionUpdated', session);
        };
        _this.onSessionDeleted = function () {
            debug('onSessionDeleted');
            _this.session = undefined;
        };
        _this.onPairingProposal = function (pairingProposal) {
            debug('onPairingProposal', pairingProposal);
            _this.pairingProposal = pairingProposal;
        };
        _this.onPairingCreated = function (pairing) {
            debug('onPairingCreated', pairing);
            _this.pairing = pairing;
        };
        _this.onPairingUpdated = function (pairing) {
            debug('onPairingUpdated', pairing);
            if (!_this.pairing) {
                debug('Attempted to update non existant pairing', pairing);
                return;
            }
            _this.pairing.state.metadata = pairing.state.metadata;
        };
        _this.onPairingDeleted = function () {
            debug('onPairingDeleted');
            _this.pairing = undefined;
        };
        _this.close = function () { return __awaiter(_this, void 0, void 0, function () {
            var reason;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client) {
                            throw new Error('Wallet must be initialized before calling close()');
                        }
                        reason = utils_1.ERROR.USER_DISCONNECTED.format();
                        if (!this.session) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.disconnect({
                                topic: this.session.topic,
                                reason: reason,
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.client.pairing.delete({ topic: this.pairing.topic, reason: reason })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.initOptions = __assign(__assign({}, defaultInitOptions), init);
        _this.connectOptions = __assign(__assign({}, defaultConnectOptions), connect);
        return _this;
    }
    /**
     * Pulled out to allow mocking
     */
    WalletConnectWallet.prototype.getWalletConnectClient = function () {
        return client_1.default.init(this.initOptions);
    };
    /**
     * Get the URI needed for out of band session establishment
     */
    WalletConnectWallet.prototype.getUri = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _c;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _c = this;
                        return [4 /*yield*/, this.getWalletConnectClient()
                            // when we're in certain environments (like the browser) the
                            // WalletConnect client will handle retrieving old sessions.
                        ];
                    case 1:
                        _c.client = _d.sent();
                        // when we're in certain environments (like the browser) the
                        // WalletConnect client will handle retrieving old sessions.
                        if (((_a = this.client.session) === null || _a === void 0 ? void 0 : _a.values.length) > 0 && ((_b = this.client.pairing) === null || _b === void 0 ? void 0 : _b.values.length) > 0) {
                            this.pairing = this.client.pairing.values[0];
                            this.session = this.client.session.values[0];
                            return [2 /*return*/];
                        }
                        this.client.on(client_1.CLIENT_EVENTS.session.proposal, this.onSessionProposal);
                        this.client.on(client_1.CLIENT_EVENTS.session.created, this.onSessionCreated);
                        this.client.on(client_1.CLIENT_EVENTS.session.updated, this.onSessionUpdated);
                        this.client.on(client_1.CLIENT_EVENTS.session.deleted, this.onSessionDeleted);
                        this.client.on(client_1.CLIENT_EVENTS.pairing.proposal, this.onPairingProposal);
                        this.client.on(client_1.CLIENT_EVENTS.pairing.created, this.onPairingCreated);
                        this.client.on(client_1.CLIENT_EVENTS.pairing.updated, this.onPairingUpdated);
                        this.client.on(client_1.CLIENT_EVENTS.pairing.deleted, this.onPairingDeleted);
                        this.client.connect(this.connectOptions).catch(function (e) {
                            console.error("WalletConnect connection failed: " + e.message);
                        });
                        return [4 /*yield*/, waitForTruthy(function () { return _this.pairingProposal; })];
                    case 2:
                        _d.sent();
                        return [2 /*return*/, this.pairingProposal.signal.params.uri];
                }
            });
        });
    };
    WalletConnectWallet.prototype.loadAccountSigners = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addressToSigner;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    /**
                     * Session establishment happens out of band so after somehow
                     * communicating the connection URI (often via QR code) we can
                     * continue with the setup process
                     */
                    return [4 /*yield*/, waitForTruthy(function () { return _this.session; })];
                    case 1:
                        /**
                         * Session establishment happens out of band so after somehow
                         * communicating the connection URI (often via QR code) we can
                         * continue with the setup process
                         */
                        _a.sent();
                        addressToSigner = new Map();
                        this.session.state.accounts.forEach(function (addressLike) {
                            var _a = (0, utils_2.parseAddress)(addressLike), address = _a.address, networkId = _a.networkId;
                            var signer = new wc_signer_1.WalletConnectSigner(_this.client, _this.session, address, networkId);
                            addressToSigner.set(address, signer);
                        });
                        return [2 /*return*/, addressToSigner];
                }
            });
        });
    };
    /**
     * Gets the signer based on the 'from' field in the tx body
     * @param txParams Transaction to sign
     * @dev overrides WalletBase.signTransaction
     */
    WalletConnectWallet.prototype.signTransaction = function (txParams) {
        return __awaiter(this, void 0, void 0, function () {
            var fromAddress, signer;
            return __generator(this, function (_a) {
                fromAddress = txParams.from.toString();
                signer = this.getSigner(fromAddress);
                return [2 /*return*/, signer.signRawTransaction(txParams)];
            });
        });
    };
    return WalletConnectWallet;
}(wallet_remote_1.RemoteWallet));
exports.WalletConnectWallet = WalletConnectWallet;
//# sourceMappingURL=wc-wallet.js.map