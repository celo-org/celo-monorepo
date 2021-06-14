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
var Web3Utils = __importStar(require("web3-utils"));
var address_1 = require("./address");
exports.POP_SIZE = 65;
var ethjsutil = require('ethereumjs-util');
// If messages is a hex, the length of it should be the number of bytes
function messageLength(message) {
    if (Web3Utils.isHexStrict(message)) {
        return (message.length - 2) / 2;
    }
    return message.length;
}
// Ethereum has a special signature format that requires a prefix
// https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
function hashMessageWithPrefix(message) {
    var prefix = '\x19Ethereum Signed Message:\n' + messageLength(message);
    return Web3Utils.soliditySha3(prefix, message);
}
exports.hashMessageWithPrefix = hashMessageWithPrefix;
function hashMessage(message) {
    return Web3Utils.soliditySha3({ type: 'string', value: message });
}
exports.hashMessage = hashMessage;
function addressToPublicKey(signer, signFn) {
    return __awaiter(this, void 0, void 0, function () {
        var msg, data, sig, rawsig, prefixedMsg, pubKey, computedAddr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    msg = new Buffer('dummy_msg_data');
                    data = '0x' + msg.toString('hex');
                    return [4 /*yield*/, signFn(data, signer)];
                case 1:
                    sig = _a.sent();
                    rawsig = ethjsutil.fromRpcSig(sig);
                    prefixedMsg = hashMessageWithPrefix(data);
                    pubKey = ethjsutil.ecrecover(Buffer.from(prefixedMsg.slice(2), 'hex'), rawsig.v, rawsig.r, rawsig.s);
                    computedAddr = ethjsutil.pubToAddress(pubKey).toString('hex');
                    if (!address_1.eqAddress(computedAddr, signer)) {
                        throw new Error('computed address !== signer');
                    }
                    return [2 /*return*/, '0x' + pubKey.toString('hex')];
            }
        });
    });
}
exports.addressToPublicKey = addressToPublicKey;
// Uses a native function to sign (as signFn), most commonly `web.eth.sign`
function NativeSigner(signFn, signer) {
    var _this = this;
    return {
        sign: function (message) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, signFn(message, signer)];
            });
        }); },
    };
}
exports.NativeSigner = NativeSigner;
function LocalSigner(privateKey) {
    var _this = this;
    return {
        sign: function (message) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve(serializeSignature(signMessage(message, privateKey, address_1.privateKeyToAddress(privateKey))))];
            });
        }); },
    };
}
exports.LocalSigner = LocalSigner;
function signedMessageToPublicKey(message, v, r, s) {
    var pubKeyBuf = ethjsutil.ecrecover(Buffer.from(message.slice(2), 'hex'), v, Buffer.from(r.slice(2), 'hex'), Buffer.from(s.slice(2), 'hex'));
    return '0x' + pubKeyBuf.toString('hex');
}
exports.signedMessageToPublicKey = signedMessageToPublicKey;
function signMessage(message, privateKey, address) {
    return signMessageWithoutPrefix(hashMessageWithPrefix(message), privateKey, address);
}
exports.signMessage = signMessage;
function signMessageWithoutPrefix(messageHash, privateKey, address) {
    var publicKey = ethjsutil.privateToPublic(ethjsutil.toBuffer(privateKey));
    var derivedAddress = ethjsutil.bufferToHex(ethjsutil.pubToAddress(publicKey));
    if (derivedAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Provided private key does not match address of intended signer');
    }
    var _a = ethjsutil.ecsign(ethjsutil.toBuffer(messageHash), ethjsutil.toBuffer(privateKey)), r = _a.r, s = _a.s, v = _a.v;
    if (!isValidSignature(address, messageHash, v, ethjsutil.bufferToHex(r), ethjsutil.bufferToHex(s))) {
        throw new Error('Unable to validate signature');
    }
    return { v: v, r: ethjsutil.bufferToHex(r), s: ethjsutil.bufferToHex(s) };
}
exports.signMessageWithoutPrefix = signMessageWithoutPrefix;
function serializeSignature(signature) {
    var serializedV = signature.v.toString(16);
    var serializedR = signature.r.slice(2);
    var serializedS = signature.s.slice(2);
    return '0x' + serializedV + serializedR + serializedS;
}
exports.serializeSignature = serializeSignature;
function verifySignature(message, signature, signer) {
    try {
        parseSignature(message, signature, signer);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.verifySignature = verifySignature;
function parseSignature(message, signature, signer) {
    return parseSignatureWithoutPrefix(hashMessageWithPrefix(message), signature, signer);
}
exports.parseSignature = parseSignature;
function parseSignatureWithoutPrefix(messageHash, signature, signer) {
    var _a;
    var _b = parseSignatureAsRsv(signature.slice(2)), r = _b.r, s = _b.s, v = _b.v;
    if (isValidSignature(signer, messageHash, v, r, s)) {
        return { v: v, r: r, s: s };
    }
    ;
    (_a = parseSignatureAsVrs(signature.slice(2)), r = _a.r, s = _a.s, v = _a.v);
    if (isValidSignature(signer, messageHash, v, r, s)) {
        return { v: v, r: r, s: s };
    }
    throw new Error("Unable to parse signature (expected signer " + signer + ")");
}
exports.parseSignatureWithoutPrefix = parseSignatureWithoutPrefix;
function guessSigner(message, signature) {
    var messageHash = hashMessageWithPrefix(message);
    var _a = parseSignatureAsRsv(signature.slice(2)), r = _a.r, s = _a.s, v = _a.v;
    var publicKey = ethjsutil.ecrecover(ethjsutil.toBuffer(messageHash), v, ethjsutil.toBuffer(r), ethjsutil.toBuffer(s));
    return ethjsutil.bufferToHex(ethjsutil.pubToAddress(publicKey));
}
exports.guessSigner = guessSigner;
function parseSignatureAsVrs(signature) {
    var v = parseInt(signature.slice(0, 2), 16);
    var r = "0x" + signature.slice(2, 66);
    var s = "0x" + signature.slice(66, 130);
    if (v < 27) {
        v += 27;
    }
    return { v: v, r: r, s: s };
}
function parseSignatureAsRsv(signature) {
    var r = "0x" + signature.slice(0, 64);
    var s = "0x" + signature.slice(64, 128);
    var v = parseInt(signature.slice(128, 130), 16);
    if (v < 27) {
        v += 27;
    }
    return { r: r, s: s, v: v };
}
function isValidSignature(signer, message, v, r, s) {
    try {
        var publicKey = ethjsutil.ecrecover(ethjsutil.toBuffer(message), v, ethjsutil.toBuffer(r), ethjsutil.toBuffer(s));
        var retrievedAddress = ethjsutil.bufferToHex(ethjsutil.pubToAddress(publicKey));
        return address_1.eqAddress(retrievedAddress, signer);
    }
    catch (err) {
        return false;
    }
}
exports.SignatureUtils = {
    NativeSigner: NativeSigner,
    LocalSigner: LocalSigner,
    signMessage: signMessage,
    signMessageWithoutPrefix: signMessageWithoutPrefix,
    parseSignature: parseSignature,
    parseSignatureWithoutPrefix: parseSignatureWithoutPrefix,
    serializeSignature: serializeSignature,
};
//# sourceMappingURL=signatureUtils.js.map