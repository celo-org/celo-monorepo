import { Address } from '@celo/utils/lib/address'
import { fromFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import debugFactory from 'debug'
import { Block, Transaction } from 'web3-eth'
import abi, { ABIDefinition } from 'web3-eth-abi'
import { CeloContract } from '../base'
import { PROXY_ABI } from '../governance/proxy'
import { ContractKit } from '../kit'
import { parseDecodedParams } from '../utils/web3-utils'
import {
  ContractDetails,
  getContractDetailsFromContract,
  mapFromPairs,
  obtainKitContractDetails,
} from './base'

const debug = debugFactory('kit:explorer:block')

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

interface ContractMapping {
  details: ContractDetails
  fnMapping: Map<string, ABIDefinition>
}

export async function newBlockExplorer(kit: ContractKit) {
  return new BlockExplorer(kit, await obtainKitContractDetails(kit))
}

const getContractMappingFromDetails = (cd: ContractDetails) => ({
  details: cd,
  fnMapping: mapFromPairs(
    (cd.jsonInterface.concat(PROXY_ABI) as ABIDefinition[])
      .filter((ad) => ad.type === 'function')
      .map((ad) => [ad.signature, ad])
  ),
})

export class BlockExplorer {
  private addressMapping: Map<Address, ContractMapping>

  constructor(private kit: ContractKit, readonly contractDetails: ContractDetails[]) {
    this.addressMapping = mapFromPairs(
      contractDetails.map((cd) => [cd.address, getContractMappingFromDetails(cd)])
    )
  }

  async updateContractDetailsMapping(name: string, address: string) {
    const cd = await getContractDetailsFromContract(this.kit, name as CeloContract, address)
    this.addressMapping.set(cd.address, getContractMappingFromDetails(cd))
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

    const matchedAbi = contractMapping.fnMapping.get(callSignature)
    if (matchedAbi == null) {
      return null
    }

    const { args, params } = parseDecodedParams(
      abi.decodeParameters(matchedAbi.inputs!, encodedParameters)
    )

    // transform numbers to big numbers in params
    matchedAbi.inputs!.forEach((abiInput, idx) => {
      if (abiInput.type === 'uint256') {
        debug('transforming number param')
        params[abiInput.name] = new BigNumber(args[idx])
      }
    })

    // transform fixidity values to fractions in params
    Object.keys(params)
      .filter((key) => key.includes('fraction')) // TODO: come up with better enumeration
      .forEach((fractionKey) => {
        debug('transforming fixed number param')
        params[fractionKey] = fromFixed(params[fractionKey])
      })

    return {
      contract: contractMapping.details.name,
      function: matchedAbi.name!,
      paramMap: params,
      argList: args,
    }
  }
}
