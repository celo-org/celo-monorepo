import debugFactory from 'debug'
// @ts-ignore-next-line
import { account as Account, bytes as Bytes, hash as Hash, nat as Nat, RLP } from 'eth-lib'
// @ts-ignore-next-line
import * as helpers from 'web3-core-helpers'
import { CeloTx } from './tx-signing'

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

export async function signTransaction(txn: any, privateKey: string) {
  let result: any

  if (!txn) {
    throw new Error('No transaction object given!')
  }

  const signed = (tx: any) => {
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
      transaction.gasCurrency = tx.gasCurrency || '0x'
      transaction.gasFeeRecipient = tx.gasFeeRecipient || '0x'

      // This order should match the order in Geth.
      // https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/core/types/transaction.go#L65
      const rlpEncoded = RLP.encode([
        Bytes.fromNat(transaction.nonce),
        Bytes.fromNat(transaction.gasPrice),
        Bytes.fromNat(transaction.gas),
        transaction.gasCurrency.toLowerCase(),
        transaction.gasFeeRecipient.toLowerCase(),
        transaction.to.toLowerCase(),
        Bytes.fromNat(transaction.value),
        transaction.data,
        Bytes.fromNat(transaction.chainId || '0x1'),
        '0x',
        '0x',
      ])

      const hash = Hash.keccak256(rlpEncoded)

      const signature = Account.makeSigner(Nat.toNumber(transaction.chainId || '0x1') * 2 + 35)(
        Hash.keccak256(rlpEncoded),
        privateKey
      )

      const rawTx = RLP.decode(rlpEncoded)
        .slice(0, 8)
        .concat(Account.decodeSignature(signature))

      rawTx[8] = makeEven(trimLeadingZero(rawTx[8]))
      rawTx[9] = makeEven(trimLeadingZero(rawTx[9]))
      rawTx[10] = makeEven(trimLeadingZero(rawTx[10]))

      const rawTransaction = RLP.encode(rawTx)

      const values = RLP.decode(rawTransaction)
      result = {
        messageHash: hash,
        v: trimLeadingZero(values[8]),
        r: trimLeadingZero(values[9]),
        s: trimLeadingZero(values[10]),
        rawTransaction,
      }
    } catch (e) {
      throw e
    }

    return result
  }

  // Resolve immediately if nonce, chainId and price are provided
  if (txn.nonce !== undefined && txn.chainId !== undefined && txn.gasPrice !== undefined) {
    return signed(txn)
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
  return signed(txn)
}

// Recover transaction and sender address from a raw transaction.
// This is used for testing.
export function recoverTransaction(rawTx: string): [CeloTx, string] {
  const rawValues = RLP.decode(rawTx)
  debug('signing-utils@recoverTransaction: values are %s', rawValues)
  const celoTx: CeloTx = {
    nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
    gasPrice: rawValues[1].toLowerCase() === '0x' ? 0 : parseInt(rawValues[1], 16),
    gas: rawValues[2].toLowerCase() === '0x' ? 0 : parseInt(rawValues[2], 16),
    gasCurrency: rawValues[3],
    gasFeeRecipient: rawValues[4],
    to: rawValues[5],
    value: rawValues[6],
    data: rawValues[7],
    chainId: rawValues[8],
  }
  const signature = Account.encodeSignature(rawValues.slice(8, 11))
  const recovery = Bytes.toNumber(rawValues[8])
  // tslint:disable-next-line:no-bitwise
  const extraData = recovery < 35 ? [] : [Bytes.fromNumber((recovery - 35) >> 1), '0x', '0x']
  const signingData = rawValues.slice(0, 8).concat(extraData)
  const signingDataHex = RLP.encode(signingData)
  const signer = Account.recover(Hash.keccak256(signingDataHex), signature)
  return [celoTx, signer]
}
