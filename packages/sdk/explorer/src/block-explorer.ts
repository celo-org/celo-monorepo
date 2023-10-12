import {
  ABIDefinition,
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
  ContractMapping,
  getContractDetailsFromContract,
  mapFromPairs,
  obtainKitContractDetails,
} from './base'
import { fetchMetadata, tryGetProxyImplementation } from './sourcify'

const debug = debugFactory('kit:explorer:block')
export interface ContractNameAndMethodAbi {
  abi: ABIDefinition
  contract: string
  contractName?: string
}

export interface CallDetails {
  contract: string
  contractAddress: Address
  isCoreContract: boolean
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

const isCoreContract = (contract: string): contract is CeloContract => contract in CeloContract

export class BlockExplorer {
  private addressMapping: Map<Address, ContractMapping>
  private proxyImplementationOverride: Map<Address, Address> = new Map()

  constructor(private kit: ContractKit, readonly contractDetails: ContractDetails[]) {
    this.addressMapping = mapFromPairs(
      contractDetails
        .filter((cd) => /Proxy$/.exec(cd.name) == null)
        .map((cd) => [cd.address, getContractMappingFromDetails(cd)])
    )
  }

  async updateContractDetailsMapping(name: CeloContract, address: string) {
    if (isCoreContract(name)) {
      const contractDetails = await getContractDetailsFromContract(this.kit, name, address)
      this.addressMapping.set(
        contractDetails.address,
        getContractMappingFromDetails(contractDetails)
      )
    }
  }

  async setProxyOverride(proxyAddress: Address, implementationAddress: Address) {
    debug('Setting proxy override for %s to %s', proxyAddress, implementationAddress)
    this.proxyImplementationOverride.set(proxyAddress, implementationAddress)
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

  async tryParseTx(tx: CeloTxPending): Promise<ParsedTx | null> {
    const callDetails = await this.tryParseTxInput(tx.to!, tx.input)
    if (!callDetails) {
      return null
    }

    return {
      tx,
      callDetails,
    }
  }

  async tryParseTxInput(address: string, input: string): Promise<CallDetails | null> {
    const selector = input.slice(0, 10)
    const contractMapping = await this.getContractMappingWithSelector(address, selector)

    if (contractMapping) {
      const methodAbi = contractMapping.fnMapping.get(selector)!
      return this.buildCallDetails(contractMapping.details, methodAbi, input)
    }
    return null
  }

  private getContractMethodAbiFromMapping = (
    contractMapping: ContractMapping,
    selector: string
  ): ContractNameAndMethodAbi | null => {
    if (contractMapping === undefined) {
      return null
    }

    const methodAbi = contractMapping.fnMapping.get(selector)
    if (methodAbi === undefined) {
      return null
    }

    return {
      contract: contractMapping.details.address,
      contractName: contractMapping.details.name,
      abi: methodAbi,
    }
  }

  /**
   * @deprecated use getContractMappingWithSelector instead
   * Returns the contract name and ABI of the method by looking up
   * the contract address either in all possible contract mappings.
   * @param address
   * @param selector
   * @param onlyCoreContracts
   * @returns The contract name and ABI of the method or null if not found
   */
  getContractMethodAbi = async (
    address: string,
    selector: string,
    onlyCoreContracts = false
  ): Promise<ContractNameAndMethodAbi | null> => {
    if (onlyCoreContracts) {
      return this.getContractMethodAbiFromCore(address, selector)
    }

    const contractMapping = await this.getContractMappingWithSelector(address, selector)
    if (contractMapping === undefined) {
      return null
    }

    return this.getContractMethodAbiFromMapping(contractMapping, selector)
  }

  /**
   * Returns the contract name and ABI of the method by looking up
   * the contract address but only in core contracts
   * @param address
   * @param selector
   * @returns The contract name and ABI of the method or null if not found
   */
  getContractMethodAbiFromCore = async (
    address: string,
    selector: string
  ): Promise<ContractNameAndMethodAbi | null> => {
    const contractMapping = await this.getContractMappingWithSelector(address, selector, [
      this.getContractMappingFromCore,
    ])

    if (contractMapping === undefined) {
      return null
    }

    return this.getContractMethodAbiFromMapping(contractMapping, selector)
  }

  /**
   * @deprecated use getContractMappingWithSelector instead
   * Returns the contract name and ABI of the method by looking up
   * the contract address in Sourcify.
   * @param address
   * @param selector
   * @returns The contract name and ABI of the method or null if not found
   */
  getContractMethodAbiFromSourcify = async (
    address: string,
    selector: string
  ): Promise<ContractNameAndMethodAbi | null> => {
    const contractMapping = await this.getContractMappingWithSelector(address, selector, [
      this.getContractMappingFromSourcify,
      this.getContractMappingFromSourcifyAsProxy,
    ])

    if (contractMapping === undefined) {
      return null
    }

    return this.getContractMethodAbiFromMapping(contractMapping, selector)
  }

  /**
   * @deprecated use getContractMappingWithSelector instead
   * Returns the contract name and ABI of the method by looking up
   * the selector in a list of known functions.
   * @param address
   * @param selector
   * @param onlyCoreContracts
   * @returns The contract name and ABI of the method or null if not found
   */
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

  buildCallDetails(contract: ContractDetails, abi: ABIDefinition, input: string): CallDetails {
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
      contract: contract.name,
      contractAddress: contract.address,
      isCoreContract: contract.isCore,
      function: abi.name!,
      paramMap: params,
      argList: args,
    }
  }

  /**
   * Returns the ContractMapping for the contract at that address, or undefined
   * by looking up the contract address in the core mappings.
   * @param address
   * @returns The ContractMapping for the contract at that address, or undefined
   */
  getContractMappingFromCore = async (address: string): Promise<ContractMapping | undefined> => {
    return this.addressMapping.get(address)
  }

  /**
   * Returns the ContractMapping for the contract at that address, or undefined
   * by looking up the contract address in Sourcify.
   * @param address
   * @returns The ContractMapping for the contract at that address, or undefined
   */
  getContractMappingFromSourcify = async (
    address: string
  ): Promise<ContractMapping | undefined> => {
    const metadata = await fetchMetadata(this.kit.connection, address)
    return metadata?.toContractMapping()
  }

  /**
   * Returns the ContractMapping for the contract at that address, or undefined
   * by looking up the contract address in Sourcify but using heuristis to treat
   * it as a proxy.
   *
   * This function is also included by the proxyImplementationOverrides map,
   * which can be used to override the implementation address for a given proxy.
   * This is exceptionally useful for parsing governence proposals that either
   * initialize a proxy or upgrade it, and then calls methods on the new implementation.
   * @param address
   * @returns The ContractMapping for the contract at that address, or undefined
   */
  getContractMappingFromSourcifyAsProxy = async (
    address: string
  ): Promise<ContractMapping | undefined> => {
    let implAddress = await tryGetProxyImplementation(this.kit.connection, address)
    if (this.proxyImplementationOverride.has(address)) {
      implAddress = this.proxyImplementationOverride.get(address)
    }
    if (implAddress) {
      const contractMapping = await this.getContractMappingFromSourcify(implAddress)
      if (contractMapping) {
        return {
          ...contractMapping,
          details: {
            ...contractMapping.details,
            address, // Show the proxy address
          },
        }
      }
    }
  }

  /**
   * Uses all of the strategies available to find a contract mapping that contains
   * the given method selector.
   * @param address
   * @param selector
   * @param strategies
   * @returns The ContractMapping for the contract which has the function selector, or undefined
   */
  async getContractMappingWithSelector(
    address: string,
    selector: string,
    strategies = [
      this.getContractMappingFromCore,
      this.getContractMappingFromSourcify,
      this.getContractMappingFromSourcifyAsProxy,
    ]
  ): Promise<ContractMapping | undefined> {
    const mappings = await Promise.all(
      strategies.map(async (strategy) => {
        const contractMapping = await strategy(address)
        if (contractMapping && contractMapping.fnMapping.get(selector)) {
          return contractMapping
        }
      })
    )
    return mappings.find((mapping) => mapping !== undefined)
  }
}
