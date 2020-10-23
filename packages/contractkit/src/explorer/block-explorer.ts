import { Block, Transaction } from 'web3-eth'
import abi from 'web3-eth-abi'
import {
  getInitializeAbiOfImplementation,
  PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE,
  PROXY_SET_IMPLEMENTATION_SIGNATURE,
} from '../governance/proxy'
import { ContractKit } from '../kit'
import { parseDecodedParams } from '../utils/web3-utils'
import { BaseExplorer } from './base'

export interface CallDetails {
  contract: string
  function: string
  paramMap: Record<string, any>
  argList: any[]
}

export interface ParsedTx {
  callDetails: CallDetails
  tx: Transaction
}

export interface ParsedBlock {
  block: Block
  parsedTx: ParsedTx[]
}

export async function newBlockExplorer(kit: ContractKit) {
  const blockExplorer = new BlockExplorer(kit)
  await blockExplorer.init()
  return blockExplorer
}

export class BlockExplorer extends BaseExplorer {
  constructor(kit: ContractKit) {
    super(kit, 'function')
  }

  async fetchBlockByHash(blockHash: string): Promise<Block> {
    // TODO fix typing: eth.getBlock support hashes and numbers
    return this.kit.web3.eth.getBlock(blockHash as any, true)
  }
  async fetchBlock(blockNumber: number): Promise<Block> {
    return this.kit.web3.eth.getBlock(blockNumber, true)
  }

  async fetchBlockRange(from: number, to: number): Promise<Block[]> {
    const results: Block[] = []
    for (let i = from; i < to; i++) {
      results.push(await this.fetchBlock(i))
    }
    return results
  }

  parseBlock(block: Block): ParsedBlock {
    const parsedTx: ParsedTx[] = []
    for (const tx of block.transactions) {
      if (typeof tx !== 'string') {
        const maybeKnownCall = this.tryParseTx(tx)
        if (maybeKnownCall != null) {
          parsedTx.push(maybeKnownCall)
        }
      }
    }

    return {
      block,
      parsedTx,
    }
  }

  tryParseTx(tx: Transaction): null | ParsedTx {
    const callDetails = this.tryParseTxInput(tx.to!, tx.input)
    if (!callDetails) {
      return null
    }

    return {
      tx,
      callDetails,
    }
  }

  tryParseTxInput(address: string, input: string): null | CallDetails {
    const contractMapping = this.addressMapping.get(address)
    if (contractMapping == null) {
      return null
    }

    const callSignature = input.slice(0, 10)
    const encodedParameters = input.slice(10)

    const matchedAbi = contractMapping.abiMapping.get(callSignature)
    if (matchedAbi == null) {
      return null
    }

    const contract =
      matchedAbi.signature === PROXY_SET_IMPLEMENTATION_SIGNATURE ||
      matchedAbi.signature === PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE
        ? contractMapping.details.name + 'Proxy'
        : contractMapping.details.name

    const { args, params } = parseDecodedParams(
      abi.decodeParameters(matchedAbi.inputs!, encodedParameters)
    )

    // Transform delegate call data into a readable params map
    if (
      matchedAbi.signature === PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE &&
      args.length === 2
    ) {
      const initializeAbi = getInitializeAbiOfImplementation(contract as any)
      const encodedInitializeParameters = args[1].slice(10)

      const { params: initializeParams } = parseDecodedParams(
        abi.decodeParameters(initializeAbi.inputs!, encodedInitializeParameters)
      )
      params[`initialize@${abi.encodeFunctionSignature(initializeAbi)}`] = initializeParams
      delete params.callbackData
    }

    return {
      contract,
      function: matchedAbi.name!,
      paramMap: params,
      argList: args,
    }
  }
}
