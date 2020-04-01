import debugFactory from 'debug'
// @ts-ignore-next-line
import { account as Account, bytes as Bytes, hash as Hash, nat as Nat, RLP } from 'eth-lib'
// @ts-ignore-next-line
import * as helpers from 'web3-core-helpers'
import { Tx } from 'web3/eth/types'
import { EncodedTransaction } from 'web3/types'
import { Signer } from '../utils/signers'

const debug = debugFactory('kit:tx:sign')

// Original code taken from
// https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js

function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined
}

function trimLeadingZero(hex: string) {
  while (hex && hex.startsWith('0x0')) {
    hex = '0x' + hex.slice(3)
  }
  return hex
}

function makeEven(hex: string) {
  if (hex.length % 2 === 1) {
    hex = hex.replace('0x', '0x0')
  }
  return hex
}

export async function signTransaction(txn: any, txSigner: Signer): Promise<EncodedTransaction> {
  let result: EncodedTransaction

  if (!txn) {
    throw new Error('No transaction object given!')
  }

  const signed = async (tx: any) => {
    if (!tx.gas && !tx.gasLimit) {
      throw new Error('"gas" is missing')
    }

    if (tx.nonce < 0 || tx.gas < 0 || tx.gasPrice < 0 || tx.chainId < 0) {
      throw new Error('Gas, gasPrice, nonce or chainId is lower than 0')
    }

    try {
      tx = helpers.formatters.inputCallFormatter(tx)

      const transaction = tx
      transaction.to = tx.to || '0x'
      transaction.data = tx.data || '0x'
      transaction.value = tx.value || '0x'
      transaction.chainId = '0x' + Number(tx.chainId).toString(16)
      transaction.feeCurrency = tx.feeCurrency || '0x'
      transaction.gatewayFeeRecipient = tx.gatewayFeeRecipient || '0x'
      transaction.gatewayFee = tx.gatewayFee || '0x'

      // This order should match the order in Geth.
      // https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/core/types/transaction.go#L65
      const rlpEncoded = RLP.encode([
        Bytes.fromNat(transaction.nonce),
        Bytes.fromNat(transaction.gasPrice),
        Bytes.fromNat(transaction.gas),
        transaction.feeCurrency.toLowerCase(),
        transaction.gatewayFeeRecipient.toLowerCase(),
        Bytes.fromNat(transaction.gatewayFee),
        transaction.to.toLowerCase(),
        Bytes.fromNat(transaction.value),
        transaction.data,
        Bytes.fromNat(transaction.chainId || '0x1'),
        '0x',
        '0x',
      ])

      const hash = Hash.keccak256(rlpEncoded)
      const addToV = Nat.toNumber(transaction.chainId || '0x1') * 2 + 35
      const signature = await txSigner.sign(addToV, hash)

      const rawTx = RLP.decode(rlpEncoded)
        .slice(0, 9)
        .concat(Account.decodeSignature(signature))

      rawTx[9] = makeEven(trimLeadingZero(rawTx[9]))
      rawTx[10] = makeEven(trimLeadingZero(rawTx[10]))
      rawTx[11] = makeEven(trimLeadingZero(rawTx[11]))

      const rawTransaction = RLP.encode(rawTx)

      const values = RLP.decode(rawTransaction)

      result = {
        tx: {
          nonce: transaction.nonce,
          gasPrice: transaction.gasPrice,
          gas: transaction.gas,
          to: transaction.to,
          value: transaction.value,
          input: transaction.input,
          v: trimLeadingZero(values[9]),
          r: trimLeadingZero(values[10]),
          s: trimLeadingZero(values[11]),
          hash,
        },
        raw: rawTransaction,
      }
    } catch (e) {
      throw e
    }

    return result
  }

  // Resolve immediately if nonce, chainId and price are provided
  if (txn.nonce !== undefined && txn.chainId !== undefined && txn.gasPrice !== undefined) {
    return await signed(txn)
  }

  const chainId = txn.chainId
  const gasPrice = txn.gasPrice
  const nonce = txn.nonce

  if (isNullOrUndefined(chainId) || isNullOrUndefined(gasPrice) || isNullOrUndefined(nonce)) {
    throw new Error(
      'One of the values "chainId", "gasPrice", or "nonce" couldn\'t be fetched: ' +
        JSON.stringify({ chainId, gasPrice, nonce })
    )
  }
  txn.chainId = chainId
  txn.gasPrice = gasPrice
  txn.nonce = nonce
  return await signed(txn)
}

// Recover transaction and sender address from a raw transaction.
// This is used for testing.
export function recoverTransaction(rawTx: string): [Tx, string] {
  const rawValues = RLP.decode(rawTx)
  debug('signing-utils@recoverTransaction: values are %s', rawValues)
  const recovery = Bytes.toNumber(rawValues[9])
  // tslint:disable-next-line:no-bitwise
  const chainId = Bytes.fromNumber((recovery - 35) >> 1)
  const celoTx: Tx = {
    nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
    gasPrice: rawValues[1].toLowerCase() === '0x' ? 0 : parseInt(rawValues[1], 16),
    gas: rawValues[2].toLowerCase() === '0x' ? 0 : parseInt(rawValues[2], 16),
    feeCurrency: rawValues[3],
    gatewayFeeRecipient: rawValues[4],
    gatewayFee: rawValues[5],
    to: rawValues[6],
    value: rawValues[7],
    data: rawValues[8],
    chainId,
  }
  const signature = Account.encodeSignature(rawValues.slice(9, 12))
  const extraData = recovery < 35 ? [] : [chainId, '0x', '0x']
  const signingData = rawValues.slice(0, 9).concat(extraData)
  const signingDataHex = RLP.encode(signingData)
  const signer = Account.recover(Hash.keccak256(signingDataHex), signature)
  return [celoTx, signer]
}
