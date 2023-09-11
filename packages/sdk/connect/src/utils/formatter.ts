import { ensureLeading0x, StrongAddress, trimLeading0x } from '@celo/base/lib/address'
import { isValidAddress, toChecksumAddress } from '@celo/utils/lib/address'
import { sha3 } from '@celo/utils/lib/solidity'
import BigNumber from 'bignumber.js'
import { encode } from 'utf8'
import { AccessList } from 'web3-core'
import {
  AccessListRaw,
  Block,
  BlockHeader,
  BlockNumber,
  CeloTx,
  CeloTxPending,
  CeloTxReceipt,
  FormattedCeloTx,
  Hex,
  Log,
} from '../types'

/**
 * Formats the input of a transaction and converts all values to HEX
 */
export function inputCeloTxFormatter(tx: CeloTx): FormattedCeloTx {
  const {
    from,
    chainId,
    nonce,
    to,
    gas,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    feeCurrency,
    gatewayFee,
    gatewayFeeRecipient,
    data,
    value,
    accessList,
    common,
    chain,
    hardfork,
    ...rest
  } = tx
  const formattedTX: Partial<FormattedCeloTx> = rest
  formattedTX.from = inputAddressFormatter(from?.toString())
  formattedTX.to = inputAddressFormatter(to)

  formattedTX.gas = numberToHex(gas)

  formattedTX.value = numberToHex(value?.toString())
  formattedTX.nonce = numberToHex(nonce?.toString())

  if (feeCurrency) {
    formattedTX.feeCurrency = inputAddressFormatter(feeCurrency)
  }
  if (gatewayFeeRecipient) {
    formattedTX.gatewayFeeRecipient = inputAddressFormatter(gatewayFeeRecipient)
  }
  if (gatewayFee) {
    formattedTX.gatewayFee = numberToHex(gatewayFee)
  }

  if (data && !isHex(data)) {
    throw new Error('The data field must be HEX encoded data.')
  } else if (data) {
    formattedTX.data = ensureLeading0x(data)
  }

  if (gasPrice) {
    formattedTX.gasPrice = numberToHex(gasPrice.toString())
  }
  if (maxFeePerGas) {
    formattedTX.maxFeePerGas = numberToHex(maxFeePerGas.toString())
  }
  if (maxPriorityFeePerGas) {
    formattedTX.maxPriorityFeePerGas = numberToHex(maxPriorityFeePerGas.toString())
  }
  if (accessList) {
    formattedTX.accessList = inputAccessListFormatter(accessList)
  }

  return formattedTX as FormattedCeloTx
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
  tx.value = outputBigNumberFormatter(tx.value)

  if (tx.gatewayFee) {
    tx.gatewayFee = outputBigNumberFormatter(tx.gatewayFee)
  }

  if (tx.gasPrice) {
    tx.gasPrice = outputBigNumberFormatter(tx.gasPrice)
  }
  if (tx.maxFeePerGas) {
    tx.maxFeePerGas = outputBigNumberFormatter(tx.maxFeePerGas)
  }
  if (tx.maxPriorityFeePerGas) {
    tx.maxPriorityFeePerGas = outputBigNumberFormatter(tx.maxPriorityFeePerGas)
  }

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
    receipt.status = Boolean(parseInt(trimLeading0x(receipt.status), 10))
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
  if (blockNumber == null) {
    return undefined
  }

  if (isPredefinedBlockNumber(blockNumber)) {
    return blockNumber
  }

  if (blockNumber === 'genesis') {
    return '0x0'
  }

  return isHexStrict(blockNumber.toString())
    ? blockNumber.toString().toLocaleLowerCase()
    : numberToHex(blockNumber.toString())!
}

// TODO prune after gingerbread hardfork
export function outputBlockHeaderFormatter(blockHeader: any): BlockHeader {
  // transform to number
  blockHeader.gasLimit = hexToNumber(blockHeader.gasLimit)
  blockHeader.gasUsed = hexToNumber(blockHeader.gasUsed)
  blockHeader.size = hexToNumber(blockHeader.size)
  blockHeader.timestamp = hexToNumber(blockHeader.timestamp)
  if (blockHeader.number !== null) {
    blockHeader.number = hexToNumber(blockHeader.number)
  }
  if (blockHeader.miner) {
    blockHeader.miner = toChecksumAddress(blockHeader.miner)
  }
  return blockHeader as BlockHeader
}

export function outputBlockFormatter(block: any): Block {
  block = outputBlockHeaderFormatter(block)

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

  return block as Block
}

export function hexToNumber(hex?: string): number | undefined {
  if (hex) {
    return new BigNumber(hex).toNumber()
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
    log.id = 'log_' + trimLeading0x(shaId).substring(0, 8)
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
  return new BigNumber(hex).toString(10)
}

function isHash(value: string) {
  return isHex(value) && value.length === 32
}

export function parseAccessList(accessListRaw: AccessListRaw | undefined): AccessList {
  const accessList: AccessList = []
  if (!accessListRaw) {
    return accessList
  }
  for (const entry of accessListRaw) {
    const [address, storageKeys] = entry

    throwIfInvalidAddress(address)

    accessList.push({
      address,
      storageKeys: storageKeys.map((key) => {
        if (isHash(key)) {
          return key
        } else {
          // same behavior as web3
          throw new Error(`Invalid storage key: ${key}`)
        }
      }),
    })
  }
  return accessList
}

function throwIfInvalidAddress(address: string) {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address: ${address}`)
  }
}

export function inputAccessListFormatter(accessList?: AccessList): AccessListRaw {
  if (!accessList || accessList.length === 0) {
    return []
  }
  return accessList.reduce((acc, { address, storageKeys }) => {
    throwIfInvalidAddress(address)

    storageKeys.forEach((storageKey) => {
      if (storageKey.length - 2 !== 64) {
        throw new Error(`Invalid storage key: ${storageKey}`)
      }
    })
    acc.push([address, storageKeys])
    return acc
  }, [] as AccessListRaw)
}

export function inputAddressFormatter(address?: string): StrongAddress | undefined {
  if (!address || address === '0x') {
    return undefined
  }
  if (isValidAddress(address)) {
    return ensureLeading0x(address).toLocaleLowerCase() as StrongAddress
  }
  throw new Error(`Provided address ${address} is invalid, the capitalization checksum test failed`)
}

export function inputSignFormatter(data: string) {
  return isHexStrict(data) ? data : utf8ToHex(data)
}

function utf8ToHex(str: string): string {
  str = encode(str)
  let hex = ''

  // remove \u0000 padding from either side
  str = str.replace(/^(?:\u0000)*/, '')
  str = str.split('').reverse().join('')
  str = str.replace(/^(?:\u0000)*/, '')
  str = str.split('').reverse().join('')

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

function isHexStrict(hex: string): boolean {
  return /^(-)?0x[0-9a-f]*$/i.test(hex)
}

function numberToHex(value?: BigNumber.Value): Hex | undefined {
  if (value) {
    const numberValue = new BigNumber(value)
    const result = ensureLeading0x(new BigNumber(value).toString(16))
    // Seen in web3, copied just in case
    return (numberValue.lt(new BigNumber(0)) ? `-${result}` : result) as Hex
  }
  return undefined
}

function isPredefinedBlockNumber(blockNumber: BlockNumber) {
  return blockNumber === 'latest' || blockNumber === 'pending' || blockNumber === 'earliest'
}
