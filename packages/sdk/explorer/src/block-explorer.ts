import {
  ABIDefinition,
  AbiItem,
  Address,
  Block,
  CeloTxPending,
  parseDecodedParams,
  signatureToAbiDefinition,
} from '@celo/connect'
import { CeloContract, ContractKit } from '@celo/contractkit'
import { PROXY_ABI } from '@celo/contractkit/lib/proxy'
import { fromFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import debugFactory from 'debug'
import {
  ContractDetails,
  getContractDetailsFromContract,
  mapFromPairs,
  obtainKitContractDetails,
} from './base'
import { fetchMetadata } from './sourcify'

const debug = debugFactory('kit:explorer:block')

export interface CallDetails {
  contract: string
  function: string
  paramMap: Record<string, any>
  argList: any[]
}

export interface ParsedTx {
  callDetails: CallDetails
  tx: CeloTxPending
}

export interface ParsedBlock {
  block: Block
  parsedTx: ParsedTx[]
}

interface ContractMapping {
  details: ContractDetails
  fnMapping: Map<string, ABIDefinition>
}

interface ContractNameAndMethodAbi {
  abi: ABIDefinition
  contract: string
  contractName?: string
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
      contractDetails
        .filter((cd) => /Proxy$/.exec(cd.name) == null)
        .map((cd) => [cd.address, getContractMappingFromDetails(cd)])
    )
  }

  async updateContractDetailsMapping(name: CeloContract, address: string) {
    const cd = await getContractDetailsFromContract(this.kit, name, address)
    this.addressMapping.set(cd.address, getContractMappingFromDetails(cd))
  }

  async fetchBlockByHash(blockHash: string): Promise<Block> {
    return this.kit.connection.getBlock(blockHash)
  }
  async fetchBlock(blockNumber: number): Promise<Block> {
    return this.kit.connection.getBlock(blockNumber)
  }

  async fetchBlockRange(from: number, to: number): Promise<Block[]> {
    const results: Block[] = []
    for (let i = from; i < to; i++) {
      results.push(await this.fetchBlock(i))
    }
    return results
  }

  async parseBlock(block: Block): Promise<ParsedBlock> {
    const parsedTx: ParsedTx[] = []
    for (const tx of block.transactions) {
      if (typeof tx !== 'string') {
        const maybeKnownCall = await this.tryParseTx(tx)
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

  async tryParseTx(tx: CeloTxPending): Promise<null | ParsedTx> {
    const callDetails = await this.tryParseTxInput(tx.to!, tx.input)
    if (!callDetails) {
      return null
    }

    return {
      tx,
      callDetails,
    }
  }

  getContractMethodAbiFromCore = (
    address: string,
    selector: string
  ): ContractNameAndMethodAbi | null => {
    const contractMapping = this.addressMapping.get(address)
    if (contractMapping) {
      const abi = contractMapping.fnMapping.get(selector)
      if (abi) {
        return {
          contract: contractMapping.details.name,
          abi,
        }
      } else {
        console.warn(
          `Function with signature ${selector} not found in contract ${contractMapping.details.name}(${address})`
        )
      }
    }

    return null
  }

  getContractMethodAbiFromSourcify = async (
    address: string,
    selector: string
  ): Promise<ContractNameAndMethodAbi | null> => {
    let metadata = await fetchMetadata(this.kit, address)
    let abi: AbiItem | null = null
    let contractName: string | null = null

    if (metadata && metadata.abi) {
      contractName = metadata.contractName
      abi = metadata.abiForSelector(selector)

      if (abi === null) {
        const implAddress = await metadata.tryGetProxyImplementation()
        console.log(implAddress)
        if (implAddress) {
          metadata = await fetchMetadata(this.kit, implAddress)
          if (metadata && metadata.abi) {
            abi = metadata?.abiForSelector(selector)
            contractName = metadata?.contractName
          }
        }
      }
    }

    if (abi !== null) {
      return {
        abi: {
          ...abi,
          signature: selector,
        },
        contract: contractName ? `${contractName}(${address})` : `Unknown(${address})`,
      }
    }

    return null
  }

  getContractMethodAbiFallback = (
    address: string,
    selector: string
  ): ContractNameAndMethodAbi | null => {
    // TODO(bogdan): This could be replaced with a call to 4byte.directory
    // or a local database of common functions.
    const knownFunctions: { [k: string]: string } = {
      '0x095ea7b3': 'approve(address to, uint256 value)',
      '0x4d49e87d': 'addLiquidity(uint256[] amounts, uint256 minLPToMint, uint256 deadline)',
    }
    const signature = knownFunctions[selector]
    if (signature) {
      return {
        abi: signatureToAbiDefinition(signature),
        contract: `Unknown(${address})`,
      }
    }
    return null
  }

  getContractMethodAbi = async (
    address: string,
    selector: string,
    onlyCoreContracts = false
  ): Promise<ContractNameAndMethodAbi | null> => {
    let resp = this.getContractMethodAbiFromCore(address, selector)
    if (resp !== null) {
      return resp
    } else if (onlyCoreContracts) {
      return null
    }

    resp = await this.getContractMethodAbiFromSourcify(address, selector)
    if (resp !== null) {
      return resp
    }
    return this.getContractMethodAbiFallback(address, selector)
  }

  buildCallDetails(contract: string, abi: ABIDefinition, input: string): CallDetails {
    const encodedParameters = input.slice(10)
    const { args, params } = parseDecodedParams(
      this.kit.connection.getAbiCoder().decodeParameters(abi.inputs!, encodedParameters)
    )

    // transform numbers to big numbers in params
    abi.inputs!.forEach((abiInput, idx) => {
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
      contract,
      function: abi.name!,
      paramMap: params,
      argList: args,
    }
  }

  async tryParseTxInput(address: string, input: string): Promise<CallDetails | null> {
    const selector = input.slice(0, 10)
    const resp = await this.getContractMethodAbi(address, selector)

    if (resp !== null) {
      return this.buildCallDetails(resp.contract, resp.abi, input)
    }
    return null
  }
}
