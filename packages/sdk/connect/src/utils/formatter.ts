import { ensureLeading0x, trimLeading0x } from '@celo/base/lib/address'
import { isValidAddress, toChecksumAddress } from '@celo/utils/lib/address'
import { sha3 } from '@celo/utils/lib/solidity'
import BigNumber from 'bignumber.js'
import { encode } from 'utf8'
import { Block, BlockNumber, CeloTx, CeloTxPending, CeloTxReceipt, Log } from '../types'

/**
 * Formats the input of a transaction and converts all values to HEX
 */
export function inputCeloTxFormatter(tx: CeloTx) {
  tx.from = inputAddressFormatter(tx.from?.toString())
  tx.to = inputAddressFormatter(tx.to)
  tx.feeCurrency = inputAddressFormatter(tx.feeCurrency)
  tx.gatewayFeeRecipient = inputAddressFormatter(tx.gatewayFeeRecipient)

  if (tx.data) {
    tx.data = ensureLeading0x(tx.data)
  }

  if (tx.data && !isHex(tx.data)) {
    throw new Error('The data field must be HEX encoded data.')
  }

  tx.gas = numberToHex(tx.gas)
  tx.gasPrice = numberToHex(tx.gasPrice?.toString())
  tx.value = numberToHex(tx.value?.toString())
  // @ts-ignore - nonce is defined as number, but uses as string (web3)
  tx.nonce = numberToHex(tx.nonce?.toString())
  tx.gatewayFee = numberToHex(tx.gatewayFee)

  // @ts-ignore - prune undefines
  Object.keys(tx).forEach((key) => tx[key] === undefined && delete tx[key])

  return tx
}

export function outputCeloTxFormatter(tx: any): CeloTxPending {
  if (tx.blockNumber !== null) {
    tx.blockNumber = hexToNumber(tx.blockNumber)
  }
  if (tx.transactionIndex !== null) {
    tx.transactionIndex = hexToNumber(tx.transactionIndex)
  }
  tx.nonce = hexToNumber(tx.nonce)
  tx.gas = hexToNumber(tx.gas)
  tx.gasPrice = outputBigNumberFormatter(tx.gasPrice)
  tx.value = outputBigNumberFormatter(tx.value)
  tx.gatewayFee = outputBigNumberFormatter(tx.gatewayFee)

  tx.to =
    tx.to && isValidAddress(tx.to)
      ? // tx.to could be `0x0` or `null` while contract creation
        (tx.to = toChecksumAddress(tx.to))
      : null // set to `null` if invalid address

  if (tx.from) {
    tx.from = toChecksumAddress(tx.from)
  }

  if (tx.feeCurrency) {
    tx.feeCurrency = toChecksumAddress(tx.feeCurrency)
  }

  if (tx.gatewayFeeRecipient) {
    tx.gatewayFeeRecipient = toChecksumAddress(tx.gatewayFeeRecipient)
  }

  return tx as CeloTxPending
}

export function outputCeloTxReceiptFormatter(receipt: any): CeloTxReceipt {
  if (typeof receipt !== 'object') {
    throw new Error('Received receipt is invalid: ' + receipt)
  }

  if (receipt.blockNumber !== null) {
    receipt.blockNumber = hexToNumber(receipt.blockNumber)
  }
  if (receipt.transactionIndex !== null) {
    receipt.transactionIndex = hexToNumber(receipt.transactionIndex)
  }
  receipt.cumulativeGasUsed = hexToNumber(receipt.cumulativeGasUsed)
  receipt.gasUsed = hexToNumber(receipt.gasUsed)

  if (Array.isArray(receipt.logs)) {
    receipt.logs = receipt.logs.map(outputLogFormatter)
  }

  if (receipt.contractAddress) {
    receipt.contractAddress = toChecksumAddress(receipt.contractAddress)
  }

  if (typeof receipt.status !== 'undefined' && receipt.status !== null) {
    receipt.status = Boolean(parseInt(receipt.status, 10))
  }

  return receipt as CeloTxReceipt
}

export function inputDefaultBlockNumberFormatter(blockNumber: BlockNumber | null | undefined) {
  if (blockNumber == null) {
    blockNumber = 'latest'
  }

  return inputBlockNumberFormatter(blockNumber)
}

export function inputBlockNumberFormatter(blockNumber: BlockNumber) {
  const originalBlockNumber = blockNumber
  if (blockNumber == null) {
    return undefined
  }

  if (typeof blockNumber !== 'string' && !(blockNumber instanceof String)) {
    blockNumber = numberToHex(blockNumber.toString())!
  }

  blockNumber = blockNumber.toLocaleLowerCase()

  if (blockNumber === 'genesis') {
    return '0x0'
  }

  if (isPredefinedBlockNumber(blockNumber) || isHex(blockNumber)) {
    return blockNumber
  }

  throw new Error(`Provided block number ${originalBlockNumber} is invalid`)
}

export function outputBlockFormatter(block: any): Block {
  // transform to number
  block.gasLimit = hexToNumber(block.gasLimit)
  block.gasUsed = hexToNumber(block.gasUsed)
  block.size = hexToNumber(block.size)
  block.timestamp = hexToNumber(block.timestamp)
  if (block.number !== null) {
    block.number = hexToNumber(block.number)
  }

  if (block.difficulty) {
    block.difficulty = outputBigNumberFormatter(block.difficulty)
  }
  if (block.totalDifficulty) {
    block.totalDifficulty = outputBigNumberFormatter(block.totalDifficulty)
  }

  if (Array.isArray(block.transactions)) {
    block.transactions.forEach((item: any) => {
      if (typeof item !== 'string' && !(item instanceof String)) {
        return outputCeloTxFormatter(item)
      }
    })
  }

  if (block.miner) {
    block.miner = toChecksumAddress(block.miner)
  }

  return block as Block
}

export function hexToNumber(hex?: string): number | undefined {
  if (hex) {
    return new BigNumber(trimLeading0x(hex), 16).toNumber()
  }
  return undefined
}

export function outputLogFormatter(log: any): Log {
  // generate a custom log id
  if (
    typeof log.blockHash === 'string' &&
    typeof log.transactionHash === 'string' &&
    typeof log.logIndex === 'string'
  ) {
    const shaId = sha3(
      trimLeading0x(log.blockHash) +
        trimLeading0x(log.transactionHash) +
        trimLeading0x(log.logIndex)
    )!
    log.id = 'log_' + trimLeading0x(shaId).substr(0, 8)
  } else if (!log.id) {
    log.id = null
  }

  if (log.blockNumber !== null) {
    log.blockNumber = hexToNumber(log.blockNumber)
  }
  if (log.transactionIndex !== null) {
    log.transactionIndex = hexToNumber(log.transactionIndex)
  }
  if (log.logIndex !== null) {
    log.logIndex = hexToNumber(log.logIndex)
  }

  if (log.address) {
    log.address = toChecksumAddress(log.address)
  }

  return log as Log
}

export function outputBigNumberFormatter(hex: string): string {
  return new BigNumber(trimLeading0x(hex), 16).toString(10)
}

export function inputAddressFormatter(address?: string): string | undefined {
  if (!address || address === '0x') {
    return undefined
  }
  if (isValidAddress(address)) {
    return ensureLeading0x(address)
  }
  throw new Error(`Provided address ${address} is invalid, the capitalization checksum test failed`)
}

export function inputSignFormatter(data: string) {
  if (isHex(data)) {
    return ensureLeading0x(data)
  }
  return utf8ToHex(data)
}

function utf8ToHex(str: string): string {
  str = encode(str)
  let hex = ''

  // remove \u0000 padding from either side
  str = str.replace(/^(?:\u0000)*/, '')
  str = str
    .split('')
    .reverse()
    .join('')
  str = str.replace(/^(?:\u0000)*/, '')
  str = str
    .split('')
    .reverse()
    .join('')

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    // if (code !== 0) {
    const n = code.toString(16)
    hex += n.length < 2 ? '0' + n : n
    // }
  }

  return ensureLeading0x(hex)
}

function isHex(hex: string): boolean {
  return /^(-0x|0x)?[0-9a-f]*$/i.test(hex)
}

function numberToHex(value?: BigNumber.Value) {
  if (value) {
    return ensureLeading0x(new BigNumber(value).toString(16))
  }
  return undefined
}

function isPredefinedBlockNumber(blockNumber: BlockNumber) {
  return blockNumber === 'latest' || blockNumber === 'pending' || blockNumber === 'earliest'
}
