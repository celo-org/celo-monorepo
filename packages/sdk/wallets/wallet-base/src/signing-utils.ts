import { ensureLeading0x, trimLeading0x } from '@celo/base/lib/address'
import {
  CIP42TXProperties,
  CeloTx,
  EIP1559TXProperties,
  EncodedTransaction,
  LegacyTXProperties,
  RLPEncodedTx,
  TransactionTypes,
  isPresent,
} from '@celo/connect'
import { inputCeloTxFormatter, parseAccessList } from '@celo/connect/lib/utils/formatter'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import * as ethUtil from '@ethereumjs/util'
import debugFactory from 'debug'
import Web3 from 'web3' // TODO try to do this without web3 direct
// @ts-ignore-next-line eth-lib types not found
import { account as Account, bytes as Bytes, hash as Hash, RLP } from 'eth-lib'
const debug = debugFactory('wallet-base:tx:sign')

// Original code taken from
// https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js

// 0x04 prefix indicates that the key is not compressed
// https://tools.ietf.org/html/rfc5480#section-2.2
export const publicKeyPrefix: number = 0x04
export const sixtyFour: number = 64
export const thirtyTwo: number = 32

function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined
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

function signatureFormatter(signature: { v: number; r: Buffer; s: Buffer }): {
  v: string
  r: string
  s: string
} {
  return {
    v: stringNumberToHex(signature.v),
    r: makeEven(trimLeadingZero(ensureLeading0x(signature.r.toString('hex')))),
    s: makeEven(trimLeadingZero(ensureLeading0x(signature.s.toString('hex')))),
  }
}

function stringNumberOrBNToHex(
  num?: number | string | ReturnType<Web3['utils']['toBN']>
): `0x${string}` {
  if (typeof num === 'string' || typeof num === 'number' || num === undefined) {
    return stringNumberToHex(num)
  } else if (Web3.utils.isBigNumber(num)) {
    return num.toString('hex') as `0x${string}`
  }
  return '0x'
}

function stringNumberToHex(num?: number | string): `0x${string}` {
  const auxNumber = Number(num)
  if (num === '0x' || num === undefined || auxNumber === 0) {
    return '0x'
  }
  return Bytes.fromNumber(auxNumber)
}
export function rlpEncodedTx(tx: CeloTx): RLPEncodedTx {
  assertSerializableTX(tx)
  const transaction = inputCeloTxFormatter(tx)
  transaction.to = Bytes.fromNat(tx.to || '0x').toLowerCase()
  transaction.nonce = Number(((tx.nonce as any) !== '0x' ? tx.nonce : 0) || 0)
  transaction.data = Bytes.fromNat(tx.data || '0x').toLowerCase()
  transaction.value = stringNumberToHex(tx.value?.toString())
  transaction.gas = stringNumberToHex(tx.gas)
  transaction.chainId = tx.chainId || 1
  // Celo Specific
  transaction.feeCurrency = Bytes.fromNat(tx.feeCurrency || '0x').toLowerCase()
  transaction.gatewayFeeRecipient = Bytes.fromNat(tx.gatewayFeeRecipient || '0x').toLowerCase()
  transaction.gatewayFee = stringNumberToHex(tx.gatewayFee)

  // Legacy
  transaction.gasPrice = stringNumberToHex(tx.gasPrice?.toString())
  // EIP1559 / CIP42
  transaction.maxFeePerGas = stringNumberOrBNToHex(tx.maxFeePerGas)
  transaction.maxPriorityFeePerGas = stringNumberOrBNToHex(tx.maxPriorityFeePerGas)

  let rlpEncode: `0x${string}`
  if (isCIP42(tx)) {
    // There shall be a typed transaction with the code 0x7c that has the following format:
    // 0x7c || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, feecurrency, gatewayFeeRecipient, gatewayfee, destination, amount, data, access_list, signature_y_parity, signature_r, signature_s]).
    // This will be in addition to the type 0x02 transaction as specified in EIP-1559.
    rlpEncode = RLP.encode([
      stringNumberToHex(transaction.chainId),
      stringNumberToHex(transaction.nonce),
      transaction.maxPriorityFeePerGas || '0x',
      transaction.maxFeePerGas || '0x',
      transaction.gas || '0x',
      transaction.feeCurrency || '0x',
      transaction.gatewayFeeRecipient || '0x',
      transaction.gatewayFee || '0x',
      transaction.to || '0x',
      transaction.value || '0x',
      transaction.data || '0x',
      transaction.accessList || '0x',
    ])
    return { transaction, rlpEncode: concatHex(['0x7c', rlpEncode]), type: 'cip42' }
  } else if (isEIP1559(tx)) {
    // https://eips.ethereum.org/EIPS/eip-1559
    // 0x02 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, amount, data, access_list, signature_y_parity, signature_r, signature_s]).
    rlpEncode = RLP.encode([
      stringNumberToHex(transaction.chainId),
      stringNumberToHex(transaction.nonce),
      transaction.maxPriorityFeePerGas || '0x',
      transaction.maxFeePerGas || '0x',
      transaction.gas || '0x',
      transaction.to || '0x',
      transaction.value || '0x',
      transaction.data || '0x',
      transaction.accessList || '0x',
    ])
    return { transaction, rlpEncode: concatHex(['0x02', rlpEncode]), type: 'eip1559' }
  } else {
    // This order should match the order in Geth.
    // https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/core/types/transaction.go#L65
    rlpEncode = RLP.encode([
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
    return { transaction, rlpEncode, type: 'celo-legacy' }
  }
}

enum TxTypeToPrefix {
  'celo-legacy' = '',
  cip42 = '0x7c',
  eip1559 = '0x02',
}

function concatTypePrefixHex(
  rawTransaction: string,
  txType: EncodedTransaction['tx']['type']
): `0x${string}` {
  const prefix = TxTypeToPrefix[txType]
  if (prefix) {
    return concatHex([prefix, rawTransaction])
  }
  return rawTransaction as `0x${string}`
}

function assertSerializableTX(tx: CeloTx) {
  if (!tx.gas) {
    throw new Error('"gas" is missing')
  }

  // ensure at least gasPrice or maxFeePerGas and maxPriorityFeePerGas are set
  if (
    !isPresent(tx.gasPrice) &&
    (!isPresent(tx.maxFeePerGas) || !isPresent(tx.maxPriorityFeePerGas))
  ) {
    throw new Error('"gasPrice" or "maxFeePerGas" and "maxPriorityFeePerGas" are missing')
  }

  // ensure that gasPrice and maxFeePerGas are not set at the same time
  if (
    isPresent(tx.gasPrice) &&
    (isPresent(tx.maxFeePerGas) || isPresent(tx.maxPriorityFeePerGas))
  ) {
    throw new Error(
      'when "maxFeePerGas" or "maxPriorityFeePerGas" are set, "gasPrice" must not be set'
    )
  }

  if (isNullOrUndefined(tx.nonce) || isNullOrUndefined(tx.chainId)) {
    throw new Error(
      'One of the values "chainId" or "nonce" couldn\'t be fetched: ' +
        JSON.stringify({ chainId: tx.chainId, nonce: tx.nonce })
    )
  }

  if (isLessThanZero(tx.nonce) || isLessThanZero(tx.gas) || isLessThanZero(tx.chainId)) {
    throw new Error('Gas, nonce or chainId is less than than 0')
  }
  isPriceToLow(tx)
}

export function isPriceToLow(tx: CeloTx) {
  const prices = [tx.gasPrice, tx.maxFeePerGas, tx.maxPriorityFeePerGas].filter(
    (price) => price != undefined
  )
  let isLow = false
  for (const price of prices) {
    if (isLessThanZero(price)) {
      throw new Error('GasPrice or maxFeePerGas or maxPriorityFeePerGas is less than than 0')
    }
  }

  return isLow
}

function isEIP1559(tx: CeloTx): boolean {
  return isPresent(tx.maxFeePerGas) && isPresent(tx.maxPriorityFeePerGas)
}

function isCIP42(tx: CeloTx): boolean {
  return isEIP1559(tx) && isPresent(tx.feeCurrency)
}

function concatHex(values: string[]): `0x${string}` {
  return `0x${values.reduce((acc, x) => acc + x.replace('0x', ''), '')}`
}

function isLessThanZero(value: CeloTx['gasPrice']) {
  if (isNullOrUndefined(value)) {
    return true
  }
  switch (typeof value) {
    case 'string':
    case 'number':
      return Number(value) < 0
    default:
      return value?.lt(Web3.utils.toBN(0)) || false
  }
}

export async function encodeTransaction(
  rlpEncoded: RLPEncodedTx,
  signature: { v: number; r: Buffer; s: Buffer }
): Promise<EncodedTransaction> {
  const sanitizedSignature = signatureFormatter(signature)
  const v = sanitizedSignature.v
  const r = sanitizedSignature.r
  const s = sanitizedSignature.s
  // new types have prefix but legacy does not
  const decodedTX =
    rlpEncoded.type === 'celo-legacy'
      ? RLP.decode(rlpEncoded.rlpEncode)
      : RLP.decode(`0x${rlpEncoded.rlpEncode.slice(4)}`)
  // for legacy tx we need to slice but for new ones we do not want to do that
  const rawTx = (rlpEncoded.type === 'celo-legacy' ? decodedTX.slice(0, 9) : decodedTX).concat([
    v,
    r,
    s,
  ])

  // After signing, the transaction is encoded again and type prefix added
  const rawTransaction = concatTypePrefixHex(RLP.encode(rawTx), rlpEncoded.type)
  const hash = getHashFromEncoded(rawTransaction)

  const baseTX = {
    nonce: rlpEncoded.transaction.nonce!.toString(),
    gas: rlpEncoded.transaction.gas!.toString(),
    to: rlpEncoded.transaction.to!.toString(),
    value: rlpEncoded.transaction.value!.toString(),
    input: rlpEncoded.transaction.data!,
    v,
    r,
    s,
    hash,
  }
  let tx: Partial<EncodedTransaction['tx']> = baseTX
  if (rlpEncoded.type === 'eip1559' || rlpEncoded.type === 'cip42') {
    tx = {
      ...tx,
      maxFeePerGas: rlpEncoded.transaction.maxFeePerGas!.toString(),
      maxPriorityFeePerGas: rlpEncoded.transaction.maxPriorityFeePerGas!.toString(),
      accessList: rlpEncoded.transaction.accessList!,
    } as EIP1559TXProperties
  }
  if (rlpEncoded.type === 'cip42' || rlpEncoded.type === 'celo-legacy') {
    tx = {
      ...tx,
      feeCurrency: rlpEncoded.transaction.feeCurrency!.toString(),
      gatewayFeeRecipient: rlpEncoded.transaction.gatewayFeeRecipient!.toString(),
      gatewayFee: rlpEncoded.transaction.gatewayFee!.toString(),
    } as CIP42TXProperties
  }
  if (rlpEncoded.type === 'celo-legacy') {
    tx = {
      ...tx,
      gasPrice: rlpEncoded.transaction.gasPrice!.toString(),
    } as LegacyTXProperties
  }

  return {
    tx: tx as EncodedTransaction['tx'],
    raw: rawTransaction,
    type: rlpEncoded.type,
  } as EncodedTransaction
}
function correctLengthWithSignatureOf(type: TransactionTypes) {
  switch (type) {
    case 'cip42':
      return 15
    case 'celo-legacy':
    case 'eip1559':
      return 12
  }
}
// Based on the return type of ensureLeading0x this was not a Buffer
export function extractSignature(rawTx: string) {
  const rawValues = RLP.decode(rawTx)
  const type = determineTXType(rawTx)
  const length = rawValues.length
  if (correctLengthWithSignatureOf(type) !== length) {
    throw new Error(
      `@extractSignature: provided transaction has ${length} elements but ${type} txs with a signature have ${correctLengthWithSignatureOf(
        type
      )}`
    )
  }
  // signature is always (for the tx we support so far) the last three elements of the array in order v, r, s,
  return extractSignatureFromDecoded(rawValues)
}

function extractSignatureFromDecoded(rawValues: unknown[]) {
  const v = rawValues.at(-3) as number
  let r = rawValues.at(-2)
  let s = rawValues.at(-1)

  // Account.recover cannot handle canonicalized signatures
  // A canonicalized signature may have the first byte removed if its value is 0
  r = ensureLeading0x(trimLeading0x(r as string).padStart(64, '0'))
  s = ensureLeading0x(trimLeading0x(s as string).padStart(64, '0'))

  return {
    v,
    r,
    s,
  }
}

// Recover transaction and sender address from a raw transaction.
// This is used for testing.
export function recoverTransaction(rawTx: string): [CeloTx, string] {
  switch (determineTXType(rawTx)) {
    case 'cip42':
      return recoverTransactionCIP42(rawTx)
    case 'eip1559':
      return recoverTransactionEIP1559(rawTx)
    default:
      const rawValues = RLP.decode(rawTx)
      debug('signing-utils@recoverTransaction: values are %s', rawValues)
      const recovery = Bytes.toNumber(rawValues[9])
      // tslint:disable-next-line:no-bitwise
      const chainId = Bytes.fromNumber((recovery - 35) >> 1)
      const celoTx: CeloTx = {
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
      const { r, v, s } = extractSignatureFromDecoded(rawValues)
      const signature = Account.encodeSignature([v, r, s])
      const extraData = recovery < 35 ? [] : [chainId, '0x', '0x']
      const signingData = rawValues.slice(0, 9).concat(extraData)
      const signingDataHex = RLP.encode(signingData)
      const signer = Account.recover(getHashFromEncoded(signingDataHex), signature)
      return [celoTx, signer]
  }
}

function determineTXType(serializedTransaction: string): TransactionTypes {
  // TODO CIP42 is this slice ok?
  if (serializedTransaction.slice(0, 4) === '0x02') {
    return 'eip1559'
  } else if (serializedTransaction.slice(0, 4) === '0x7c') {
    return 'cip42'
  }
  return 'celo-legacy'
}

function recoverTransactionCIP42(serializedTransaction: string): [CeloTx, string] {
  const transactionArray = RLP.decode(`0x${serializedTransaction.slice(4)}`)
  debug('signing-utils@recoverTransactionCIP42: values are %s', transactionArray)
  if (transactionArray.length !== 15 && transactionArray.length !== 12) {
    throw new Error(
      `Invalid transaction length for type CIP42: ${transactionArray.length} instead of 15 or 12. array: ${transactionArray}`
    )
  }
  const [
    chainId,
    nonce,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gas,
    feeCurrency,
    gatewayFeeRecipient,
    gatewayFee,
    to,
    value,
    data,
    accessList,
    v,
    r,
    s,
  ] = transactionArray

  const celoTX: CeloTx = {
    nonce: nonce.toLowerCase() === '0x' ? 0 : parseInt(nonce, 16),
    maxPriorityFeePerGas:
      maxPriorityFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxPriorityFeePerGas, 16),
    maxFeePerGas: maxFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxFeePerGas, 16),
    gas: gas.toLowerCase() === '0x' ? 0 : parseInt(gas, 16),
    feeCurrency,
    gatewayFeeRecipient,
    gatewayFee,
    to,
    value,
    data,
    chainId,
    accessList: parseAccessList(accessList),
  }
  const signer = getSignerFromTx(v, r, s, transactionArray)
  return [celoTX, signer]
}

function getSignerFromTx(v: any, r: any, s: any, transactionArray: string[]) {
  const signature = Account.encodeSignature([v, r, s])
  const signingDataHex = RLP.encode(transactionArray)
  const signer = Account.recover(getHashFromEncoded(signingDataHex), signature)
  return signer
}

function recoverTransactionEIP1559(serializedTransaction: string): [CeloTx, string] {
  const transactionArray = RLP.decode(`0x${serializedTransaction.slice(4)}`)
  debug('signing-utils@recoverTransactionEIP1559: values are %s', transactionArray)

  const [
    chainId,
    nonce,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gas,
    to,
    value,
    data,
    accessList,
    v,
    r,
    s,
  ] = transactionArray

  const celoTx: CeloTx = {
    nonce: nonce.toLowerCase() === '0x' ? 0 : parseInt(nonce, 16),
    gas: gas.toLowerCase() === '0x' ? 0 : parseInt(gas, 16),
    maxPriorityFeePerGas:
      maxPriorityFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxPriorityFeePerGas, 16),
    maxFeePerGas: maxFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxFeePerGas, 16),
    to: to,
    value: value,
    data: data,
    chainId,
    accessList: parseAccessList(accessList),
  }
  const signer = getSignerFromTx(v, r, s, transactionArray)

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
  const dataHex = ethUtil.bufferToHex(generateTypedDataHash(typedData))
  return verifySignatureWithoutPrefix(dataHex, signedData, expectedAddress)
}

export function verifySignatureWithoutPrefix(
  messageHash: string,
  signature: string,
  signer: string
) {
  try {
    parseSignatureWithoutPrefix(messageHash, signature, signer)
    return true
  } catch (error) {
    return false
  }
}

export function decodeSig(sig: any) {
  const [v, r, s] = Account.decodeSignature(sig)
  return {
    v: parseInt(v, 16),
    r: ethUtil.toBuffer(r) as Buffer,
    s: ethUtil.toBuffer(s) as Buffer,
  }
}
