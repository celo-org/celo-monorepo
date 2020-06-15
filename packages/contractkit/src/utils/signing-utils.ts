import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import debugFactory from 'debug'
// @ts-ignore-next-line
import { account as Account, bytes as Bytes, hash as Hash, RLP } from 'eth-lib'
import * as ethUtil from 'ethereumjs-util'
import { EncodedTransaction, Tx } from 'web3-core'
import * as helpers from 'web3-core-helpers'
import { EIP712TypedData, generateTypedDataHash } from './sign-typed-data-utils'

const debug = debugFactory('kit:tx:sign')

// Original code taken from
// https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js

function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined
}

export interface RLPEncodedTx {
  transaction: Tx
  rlpEncode: any
}

// Simple replay attack protection
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
export function chainIdTransformationForSigning(chainId: number): number {
  return chainId * 2 + 35
}

export function getHashFromEncoded(rlpEncode: string): string {
  return Hash.keccak256(rlpEncode)
}

function trimLeadingZero(hex: string) {
  while (hex && hex.startsWith('0x0')) {
    hex = ensureLeading0x(hex.slice(3))
  }
  return hex
}

function makeEven(hex: string) {
  if (hex.length % 2 === 1) {
    hex = hex.replace('0x', '0x0')
  }
  return hex
}

function signatureFormatter(signature: {
  v: number
  r: Buffer
  s: Buffer
}): { v: string; r: string; s: string } {
  return {
    v: stringNumberToHex(signature.v),
    r: makeEven(trimLeadingZero(ensureLeading0x(signature.r.toString('hex')))),
    s: makeEven(trimLeadingZero(ensureLeading0x(signature.s.toString('hex')))),
  }
}

function stringNumberToHex(num?: number | string): string {
  const auxNumber = Number(num)
  if (num === '0x' || num === undefined || auxNumber === 0) {
    return '0x'
  }
  return Bytes.fromNumber(auxNumber)
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
  const transaction: Tx = helpers.formatters.inputCallFormatter(tx)
  transaction.to = Bytes.fromNat(tx.to || '0x').toLowerCase()
  transaction.nonce = Number(((tx.nonce as any) !== '0x' ? tx.nonce : 0) || 0)
  transaction.data = Bytes.fromNat(tx.data || '0x').toLowerCase()
  transaction.value = stringNumberToHex(tx.value?.toString())
  transaction.feeCurrency = Bytes.fromNat(tx.feeCurrency || '0x').toLowerCase()
  transaction.gatewayFeeRecipient = Bytes.fromNat(tx.gatewayFeeRecipient || '0x').toLowerCase()
  transaction.gatewayFee = stringNumberToHex(tx.gatewayFee)
  transaction.gasPrice = stringNumberToHex(tx.gasPrice?.toString())
  transaction.gas = stringNumberToHex(tx.gas)
  transaction.chainId = tx.chainId || 1

  // This order should match the order in Geth.
  // https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/core/types/transaction.go#L65
  const rlpEncode = RLP.encode([
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
  ])

  return { transaction, rlpEncode }
}

export async function encodeTransaction(
  rlpEncoded: RLPEncodedTx,
  signature: { v: number; r: Buffer; s: Buffer }
): Promise<EncodedTransaction> {
  const hash = getHashFromEncoded(rlpEncoded.rlpEncode)

  const sanitizedSignature = signatureFormatter(signature)
  const v = sanitizedSignature.v
  const r = sanitizedSignature.r
  const s = sanitizedSignature.s
  const rawTx = RLP.decode(rlpEncoded.rlpEncode)
    .slice(0, 9)
    .concat([v, r, s])

  const rawTransaction = RLP.encode(rawTx)

  const result: EncodedTransaction = {
    tx: {
      nonce: rlpEncoded.transaction.nonce!.toString(),
      gasPrice: rlpEncoded.transaction.gasPrice!.toString(),
      gas: rlpEncoded.transaction.gas!.toString(),
      to: rlpEncoded.transaction.to!.toString(),
      value: rlpEncoded.transaction.value!.toString(),
      input: rlpEncoded.transaction.data!,
      v,
      r,
      s,
      hash,
    },
    raw: rawTransaction,
  }
  return result
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
  let r = rawValues[10]
  let s = rawValues[11]
  // Account.recover cannot handle canonicalized signatures
  // A canonicalized signature may have the first byte removed if its value is 0
  r = ensureLeading0x(trimLeading0x(r).padStart(64, '0'))
  s = ensureLeading0x(trimLeading0x(s).padStart(64, '0'))
  const signature = Account.encodeSignature([rawValues[9], r, s])
  const extraData = recovery < 35 ? [] : [chainId, '0x', '0x']
  const signingData = rawValues.slice(0, 9).concat(extraData)
  const signingDataHex = RLP.encode(signingData)
  const signer = Account.recover(getHashFromEncoded(signingDataHex), signature)
  return [celoTx, signer]
}

export function recoverMessageSigner(signingDataHex: string, signedData: string): string {
  const dataBuff = ethUtil.toBuffer(signingDataHex)
  const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)
  const signature = ethUtil.fromRpcSig(signedData)

  const publicKey = ethUtil.ecrecover(msgHashBuff, signature.v, signature.r, signature.s)
  const address = ethUtil.pubToAddress(publicKey, true)
  return ensureLeading0x(address.toString('hex'))
}

export function verifyEIP712TypedDataSigner(
  typedData: EIP712TypedData,
  signedData: string,
  expectedAddress: string
): boolean {
  const dataBuff = generateTypedDataHash(typedData)
  const trimmedData = dataBuff.toString('hex')
  const valid = verifySignature(ensureLeading0x(trimmedData), signedData, expectedAddress)
  return valid
}
