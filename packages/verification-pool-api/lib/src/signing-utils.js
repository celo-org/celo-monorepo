"use strict";
// Originally taken from https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const eth_lib_1 = require("eth-lib");
const _ = __importStar(require("lodash"));
const helpers = __importStar(require("web3-core-helpers"));
const utils = __importStar(require("web3-utils"));
function isNot(value) {
    return _.isUndefined(value) || _.isNull(value);
}
function trimLeadingZero(hex) {
    while (hex && hex.startsWith('0x0')) {
        hex = '0x' + hex.slice(3);
    }
    return hex;
}
function makeEven(hex) {
    if (hex.length % 2 === 1) {
        hex = hex.replace('0x', '0x0');
    }
    return hex;
}
function signTransaction(web3, txn, privateKey) {
    return __awaiter(this, void 0, void 0, function* () {
        let result;
        if (!txn) {
            throw new Error('No transaction object given!');
        }
        const signed = (tx) => {
            if (!tx.gas && !tx.gasLimit) {
                throw new Error('"gas" is missing');
            }
            if (tx.nonce < 0 || tx.gas < 0 || tx.gasPrice < 0 || tx.chainId < 0) {
                throw new Error('Gas, gasPrice, nonce or chainId is lower than 0');
            }
            try {
                tx = helpers.formatters.inputCallFormatter(tx);
                const transaction = tx;
                transaction.to = tx.to || '0x';
                transaction.data = tx.data || '0x';
                transaction.value = tx.value || '0x';
                transaction.chainId = utils.numberToHex(tx.chainId);
                transaction.feeCurrency = tx.feeCurrency || '0x';
                transaction.gatewayFeeRecipient = tx.gatewayFeeRecipient || '0x';
                transaction.gatewayFee = tx.gatewayFee || '0x';
                const rlpEncoded = eth_lib_1.RLP.encode([
                    eth_lib_1.bytes.fromNat(transaction.nonce),
                    eth_lib_1.bytes.fromNat(transaction.gasPrice),
                    eth_lib_1.bytes.fromNat(transaction.gas),
                    transaction.feeCurrency.toLowerCase(),
                    transaction.gatewayFeeRecipient.toLowerCase(),
                    eth_lib_1.bytes.fromNat(transaction.gatewayFee),
                    transaction.to.toLowerCase(),
                    eth_lib_1.bytes.fromNat(transaction.value),
                    transaction.data,
                    eth_lib_1.bytes.fromNat(transaction.chainId || '0x1'),
                    '0x',
                    '0x',
                ]);
                const messageHash = eth_lib_1.hash.keccak256(rlpEncoded);
                const signature = eth_lib_1.account.makeSigner(eth_lib_1.nat.toNumber(transaction.chainId || '0x1') * 2 + 35)(eth_lib_1.hash.keccak256(rlpEncoded), privateKey);
                const rawTx = eth_lib_1.RLP.decode(rlpEncoded)
                    .slice(0, 9)
                    .concat(eth_lib_1.account.decodeSignature(signature));
                rawTx[9] = makeEven(trimLeadingZero(rawTx[9]));
                rawTx[10] = makeEven(trimLeadingZero(rawTx[10]));
                rawTx[11] = makeEven(trimLeadingZero(rawTx[11]));
                const rawTransaction = eth_lib_1.RLP.encode(rawTx);
                const values = eth_lib_1.RLP.decode(rawTransaction);
                result = {
                    messageHash,
                    v: trimLeadingZero(values[9]),
                    r: trimLeadingZero(values[10]),
                    s: trimLeadingZero(values[11]),
                    rawTransaction,
                };
            }
            catch (e) {
                throw e;
            }
            return result;
        };
        // Resolve immediately if nonce, chainId and price are provided
        if (txn.nonce !== undefined && txn.chainId !== undefined && txn.gasPrice !== undefined) {
            return signed(txn);
        }
        // Otherwise, get the missing info from the Ethereum Node
        const chainId = isNot(txn.chainId) ? yield web3.eth.net.getId() : txn.chainId;
        const gasPrice = isNot(txn.gasPrice) ? yield web3.eth.getGasPrice() : txn.gasPrice;
        const nonce = isNot(txn.nonce)
            ? yield web3.eth.getTransactionCount(eth_lib_1.account.fromPrivate(privateKey).address)
            : txn.nonce;
        if (isNot(chainId) || isNot(gasPrice) || isNot(nonce)) {
            throw new Error('One of the values "chainId", "gasPrice", or "nonce" couldn\'t be fetched: ' +
                JSON.stringify({ chainId, gasPrice, nonce }));
        }
        return signed(_.extend(txn, { chainId, gasPrice, nonce }));
    });
}
exports.signTransaction = signTransaction;
//# sourceMappingURL=signing-utils.js.map