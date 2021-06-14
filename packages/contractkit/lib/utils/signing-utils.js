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
var signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
var debug_1 = __importDefault(require("debug"));
// @ts-ignore-next-line
var eth_lib_1 = require("eth-lib");
var ethUtil = __importStar(require("ethereumjs-util"));
var helpers = __importStar(require("web3-core-helpers"));
var sign_typed_data_utils_1 = require("./sign-typed-data-utils");
var debug = debug_1.default('kit:tx:sign');
// Original code taken from
// https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js
function isNullOrUndefined(value) {
    return value === null || value === undefined;
}
// Simple replay attack protection
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
function chainIdTransformationForSigning(chainId) {
    return chainId * 2 + 35;
}
exports.chainIdTransformationForSigning = chainIdTransformationForSigning;
function getHashFromEncoded(rlpEncode) {
    return eth_lib_1.hash.keccak256(rlpEncode);
}
exports.getHashFromEncoded = getHashFromEncoded;
function trimLeadingZero(hex) {
    while (hex && hex.startsWith('0x0')) {
        hex = address_1.ensureLeading0x(hex.slice(3));
    }
    return hex;
}
function makeEven(hex) {
    if (hex.length % 2 === 1) {
        hex = hex.replace('0x', '0x0');
    }
    return hex;
}
function signatureFormatter(signature) {
    return {
        v: stringNumberToHex(signature.v),
        r: makeEven(trimLeadingZero(address_1.ensureLeading0x(signature.r.toString('hex')))),
        s: makeEven(trimLeadingZero(address_1.ensureLeading0x(signature.s.toString('hex')))),
    };
}
function stringNumberToHex(num) {
    var auxNumber = Number(num);
    if (num === '0x' || num === undefined || auxNumber === 0) {
        return '0x';
    }
    return eth_lib_1.bytes.fromNumber(auxNumber);
}
function rlpEncodedTx(tx) {
    var _a, _b;
    if (!tx.gas) {
        throw new Error('"gas" is missing');
    }
    if (isNullOrUndefined(tx.chainId) ||
        isNullOrUndefined(tx.gasPrice) ||
        isNullOrUndefined(tx.nonce)) {
        throw new Error('One of the values "chainId", "gasPrice", or "nonce" couldn\'t be fetched: ' +
            JSON.stringify({ chainId: tx.chainId, gasPrice: tx.gasPrice, nonce: tx.nonce }));
    }
    if (tx.nonce < 0 || tx.gas < 0 || tx.gasPrice < 0 || tx.chainId < 0) {
        throw new Error('Gas, gasPrice, nonce or chainId is lower than 0');
    }
    var transaction = helpers.formatters.inputCallFormatter(tx);
    transaction.to = eth_lib_1.bytes.fromNat(tx.to || '0x').toLowerCase();
    transaction.nonce = Number((tx.nonce !== '0x' ? tx.nonce : 0) || 0);
    transaction.data = eth_lib_1.bytes.fromNat(tx.data || '0x').toLowerCase();
    transaction.value = stringNumberToHex((_a = tx.value) === null || _a === void 0 ? void 0 : _a.toString());
    transaction.feeCurrency = eth_lib_1.bytes.fromNat(tx.feeCurrency || '0x').toLowerCase();
    transaction.gatewayFeeRecipient = eth_lib_1.bytes.fromNat(tx.gatewayFeeRecipient || '0x').toLowerCase();
    transaction.gatewayFee = stringNumberToHex(tx.gatewayFee);
    transaction.gasPrice = stringNumberToHex((_b = tx.gasPrice) === null || _b === void 0 ? void 0 : _b.toString());
    transaction.gas = stringNumberToHex(tx.gas);
    transaction.chainId = tx.chainId || 1;
    // This order should match the order in Geth.
    // https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/core/types/transaction.go#L65
    var rlpEncode = eth_lib_1.RLP.encode([
        stringNumberToHex(transaction.nonce),
        transaction.gasPrice,
        transaction.gas,
        transaction.feeCurrency,
        transaction.gatewayFeeRecipient,
        transaction.gatewayFee,
        transaction.to,
        transaction.value,
        transaction.data,
        stringNumberToHex(transaction.chainId),
        '0x',
        '0x',
    ]);
    return { transaction: transaction, rlpEncode: rlpEncode };
}
exports.rlpEncodedTx = rlpEncodedTx;
function encodeTransaction(rlpEncoded, signature) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, sanitizedSignature, v, r, s, rawTx, rawTransaction, result;
        return __generator(this, function (_a) {
            hash = getHashFromEncoded(rlpEncoded.rlpEncode);
            sanitizedSignature = signatureFormatter(signature);
            v = sanitizedSignature.v;
            r = sanitizedSignature.r;
            s = sanitizedSignature.s;
            rawTx = eth_lib_1.RLP.decode(rlpEncoded.rlpEncode)
                .slice(0, 9)
                .concat([v, r, s]);
            rawTransaction = eth_lib_1.RLP.encode(rawTx);
            result = {
                tx: {
                    nonce: rlpEncoded.transaction.nonce.toString(),
                    gasPrice: rlpEncoded.transaction.gasPrice.toString(),
                    gas: rlpEncoded.transaction.gas.toString(),
                    to: rlpEncoded.transaction.to.toString(),
                    value: rlpEncoded.transaction.value.toString(),
                    input: rlpEncoded.transaction.data,
                    v: v,
                    r: r,
                    s: s,
                    hash: hash,
                },
                raw: rawTransaction,
            };
            return [2 /*return*/, result];
        });
    });
}
exports.encodeTransaction = encodeTransaction;
// Recover transaction and sender address from a raw transaction.
// This is used for testing.
function recoverTransaction(rawTx) {
    var rawValues = eth_lib_1.RLP.decode(rawTx);
    debug('signing-utils@recoverTransaction: values are %s', rawValues);
    var recovery = eth_lib_1.bytes.toNumber(rawValues[9]);
    // tslint:disable-next-line:no-bitwise
    var chainId = eth_lib_1.bytes.fromNumber((recovery - 35) >> 1);
    var celoTx = {
        nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
        gasPrice: rawValues[1].toLowerCase() === '0x' ? 0 : parseInt(rawValues[1], 16),
        gas: rawValues[2].toLowerCase() === '0x' ? 0 : parseInt(rawValues[2], 16),
        feeCurrency: rawValues[3],
        gatewayFeeRecipient: rawValues[4],
        gatewayFee: rawValues[5],
        to: rawValues[6],
        value: rawValues[7],
        data: rawValues[8],
        chainId: chainId,
    };
    var r = rawValues[10];
    var s = rawValues[11];
    // Account.recover cannot handle canonicalized signatures
    // A canonicalized signature may have the first byte removed if its value is 0
    r = address_1.ensureLeading0x(address_1.trimLeading0x(r).padStart(64, '0'));
    s = address_1.ensureLeading0x(address_1.trimLeading0x(s).padStart(64, '0'));
    var signature = eth_lib_1.account.encodeSignature([rawValues[9], r, s]);
    var extraData = recovery < 35 ? [] : [chainId, '0x', '0x'];
    var signingData = rawValues.slice(0, 9).concat(extraData);
    var signingDataHex = eth_lib_1.RLP.encode(signingData);
    var signer = eth_lib_1.account.recover(getHashFromEncoded(signingDataHex), signature);
    return [celoTx, signer];
}
exports.recoverTransaction = recoverTransaction;
function recoverMessageSigner(signingDataHex, signedData) {
    var dataBuff = ethUtil.toBuffer(signingDataHex);
    var msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
    var signature = ethUtil.fromRpcSig(signedData);
    var publicKey = ethUtil.ecrecover(msgHashBuff, signature.v, signature.r, signature.s);
    var address = ethUtil.pubToAddress(publicKey, true);
    return address_1.ensureLeading0x(address.toString('hex'));
}
exports.recoverMessageSigner = recoverMessageSigner;
function verifyEIP712TypedDataSigner(typedData, signedData, expectedAddress) {
    var dataBuff = sign_typed_data_utils_1.generateTypedDataHash(typedData);
    var trimmedData = dataBuff.toString('hex');
    var valid = signatureUtils_1.verifySignature(address_1.ensureLeading0x(trimmedData), signedData, expectedAddress);
    return valid;
}
exports.verifyEIP712TypedDataSigner = verifyEIP712TypedDataSigner;
//# sourceMappingURL=signing-utils.js.map