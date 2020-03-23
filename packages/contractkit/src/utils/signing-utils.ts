import debugFactory from 'debug'
// @ts-ignore-next-line
import { account as Account, bytes as Bytes, hash as Hash, RLP } from 'eth-lib'
import { EncodedTransaction, Tx } from 'web3-core'
// @ts-ignore-next-line
import * as helpers from 'web3-core-helpers'

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

export interface RLPEncodedTx {
  transaction: Tx
  rlpEncode: any
}

export function chainIdTransformationForSigning(chainId: number): number {
  return chainId * 2 + 35
}

export function getHashFromEncoded(rlpEncode: string): string {
  return Hash.keccak256(rlpEncode)
}

function stringNumberToHex(num: string | number): string {
  num = num === '0x' ? '0x0' : num
  return Bytes.fromNat('0x' + Number(num).toString(16))
}

export function rlpEncodedTx(tx: Tx): RLPEncodedTx {
  if (!tx.gas) {
    throw new Error('"gas" is missing')
  }

  if (
    isNullOrUndefined(tx.chainId) ||
    isNullOrUndefined(tx.gasPrice) ||
    isNullOrUndefined(tx.nonce)
  ) {
    throw new Error(
      'One of the values "chainId", "gasPrice", or "nonce" couldn\'t be fetched: ' +
        JSON.stringify({ chainId: tx.chainId, gasPrice: tx.gasPrice, nonce: tx.nonce })
    )
  }

  if (tx.nonce! < 0 || tx.gas! < 0 || tx.gasPrice! < 0 || tx.chainId! < 0) {
    throw new Error('Gas, gasPrice, nonce or chainId is lower than 0')
  }

  tx = helpers.formatters.inputCallFormatter(tx)
  const transaction = tx
  transaction.to = tx.to || '0x'
  transaction.data = tx.data || '0x'
  transaction.value = stringNumberToHex((tx.value || '0x').toString())
  transaction.chainId = tx.chainId || 1
  transaction.feeCurrency = tx.feeCurrency || '0x'
  transaction.gatewayFeeRecipient = tx.gatewayFeeRecipient || '0x'
  transaction.gatewayFee = stringNumberToHex((tx.gatewayFee || '0x').toString())
  transaction.gasPrice = stringNumberToHex(transaction.gasPrice!.toString())
  transaction.gas = stringNumberToHex(transaction.gas!.toString())

  // This order should match the order in Geth.
  // https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/core/types/transaction.go#L65
  const rlpEncode = RLP.encode([
    Bytes.fromNat(transaction.nonce),
    transaction.gasPrice,
    transaction.gas,
    transaction.feeCurrency.toLowerCase(),
    transaction.gatewayFeeRecipient.toLowerCase(),
    transaction.gatewayFee,
    transaction.to.toLowerCase(),
    transaction.value,
    transaction.data,
    stringNumberToHex(transaction.chainId),
    '0x',
    '0x',
  ])

  return { transaction, rlpEncode }
}

export function signEncodedTransaction(
  privateKey: string,
  rlpEncoded: RLPEncodedTx
): {
  s: string
  v: string
  r: string
} {
  const hash = getHashFromEncoded(rlpEncoded.rlpEncode)
  const signature = Account.makeSigner(
    chainIdTransformationForSigning(rlpEncoded.transaction.chainId!)
  )(hash, privateKey)
  const [v, r, s] = Account.decodeSignature(signature)

  return {
    v: makeEven(trimLeadingZero(v)),
    r: makeEven(trimLeadingZero(r)),
    s: makeEven(trimLeadingZero(s)),
  }
}

export async function encodeTransaction(
  rlpEncoded: RLPEncodedTx,
  signature: { v: string; r: string; s: string }
): Promise<EncodedTransaction> {
  const hash = getHashFromEncoded(rlpEncoded.rlpEncode)

  const rawTx = RLP.decode(rlpEncoded.rlpEncode)
    .slice(0, 9)
    .concat([signature.v, signature.r, signature.s])

  const rawTransaction = RLP.encode(rawTx)

  const result: EncodedTransaction = {
    tx: {
      nonce: rlpEncoded.transaction.nonce!.toString(),
      gasPrice: rlpEncoded.transaction.gasPrice!.toString(),
      gas: rlpEncoded.transaction.gas!.toString(),
      to: rlpEncoded.transaction.to!.toString(),
      value: rlpEncoded.transaction.value!.toString(),
      input: (rlpEncoded.transaction as any).input,
      v: signature.v,
      r: signature.r,
      s: signature.s,
      hash,
    },
    raw: rawTransaction,
  }
  return result
}

export async function signTransaction(tx: Tx, privateKey: string): Promise<EncodedTransaction> {
  if (!tx) {
    throw new Error('No transaction object given!')
  }
  const encoded = rlpEncodedTx(tx)

  const sig = signEncodedTransaction(privateKey, encoded)

  return encodeTransaction(encoded, sig)
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
  const signer = Account.recover(getHashFromEncoded(signingDataHex), signature)
  return [celoTx, signer]
}
