import { chain, omitBy } from 'lodash'
import Web3 from 'web3'
import { ABIDefinition } from 'web3/eth/abi'
import { Transaction } from 'web3/eth/types'
import { Log } from 'web3/types'
import { CeloContract } from './contract-utils'

interface FunctionABICacheEntry {
  functionABI: ABIDefinition
  contract: CeloContract
}

export interface FunctionABICache {
  // functionSignature = methodID + contract address
  [functionSignature: string]: FunctionABICacheEntry
}

export function getFunctionSignatureFromInput(
  transaction: Transaction,
  cache: FunctionABICache
): FunctionABICacheEntry | null {
  // As per specificaton, the first 4 bytes denote the method ID. With the leading
  // '0x' and 2 chars per byte, this gives us the first 10 chars for the functionSignature
  // https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector
  const functionSignature = transaction.input.substring(0, 10) + transaction.to
  return cache[functionSignature]
}

function removeNonParameters(parameters: any) {
  const integerPattern = new RegExp(/^\d/)
  return omitBy(
    parameters,
    (_value, key) => integerPattern.test(key) || key === '__length__' || key === 'transactionId'
  )
}

export function constructFunctionABICache(contracts: CeloContract[], web3: Web3) {
  return chain(contracts)
    .flatMap((contract) => {
      return contract.options.jsonInterface
        .filter((functionABI) => functionABI.type === 'function')
        .map((functionABI) => {
          return {
            functionSignature:
              web3.eth.abi.encodeFunctionSignature(functionABI) + contract.options.address,
            functionABI,
            contract,
          }
        })
    })
    .keyBy('functionSignature')
    .value()
}

export interface CeloFunctionCall {
  transactionHash: string
  functionName: string
  contractName: string
  parameters: { [key: string]: any }
}

export function parseFunctionCall(
  transaction: Transaction,
  functionABICache: FunctionABICache,
  web3: Web3
): [CeloFunctionCall, CeloContract] | null {
  const functionABI = getFunctionSignatureFromInput(transaction, functionABICache)
  if (
    functionABI == null ||
    functionABI === undefined ||
    functionABI.functionABI.inputs === undefined
  ) {
    return null
  }

  const parameters = web3.eth.abi.decodeParameters(
    functionABI.functionABI.inputs,
    transaction.input.slice(10)
  )

  return [
    {
      transactionHash: transaction.hash,
      functionName: functionABI.functionABI.name!,
      contractName: functionABI.contract.name,
      parameters: removeNonParameters(parameters),
    },
    functionABI.contract,
  ]
}

export interface CeloLog {
  transactionHash: string
  logName: string
  contractName: string
  functionName: string
  parameters: { [key: string]: any }
}

export function parseLog(
  transaction: CeloFunctionCall,
  log: Log,
  contract: CeloContract,
  web3: Web3
): CeloLog | null {
  const signature = log.topics[0]

  const matchingABI = contract.options.jsonInterface.find(
    (abi) => abi.type === 'event' && web3.eth.abi.encodeEventSignature(abi) === signature
  )

  if (matchingABI == null) {
    return null
  }

  const topics = matchingABI.anonymous ? log.topics : log.topics.slice(1)

  return {
    transactionHash: transaction.transactionHash,
    logName: matchingABI.name!,
    contractName: contract.name,
    functionName: transaction.functionName,
    parameters: removeNonParameters(web3.eth.abi.decodeLog(matchingABI.inputs!, log.data, topics)),
  }
}
