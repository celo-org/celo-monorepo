import { ABIDefinition, Address, Block, CeloTxPending, parseDecodedParams } from '@celo/connect'
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

  async updateContractDetailsMapping(name: string, address: string) {
    if (isCoreContract(name)) {
      const cd = await getContractDetailsFromContract(this.kit, name, address)
      this.addressMapping.set(cd.address, getContractMappingFromDetails(cd))
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

  getContractMappingFromSourcify = async (
    address: string
  ): Promise<ContractMapping | undefined> => {
    const metadata = await fetchMetadata(this.kit.connection, address)
    return metadata?.toContractMapping()
  }

  buildCallDetails(
    contract: ContractDetails,
    input: string,
    methodABI: ABIDefinition
  ): CallDetails {
    const encodedParameters = input.slice(10)
    const { args, params } = parseDecodedParams(
      this.kit.connection.getAbiCoder().decodeParameters(methodABI.inputs!, encodedParameters)
    )

    // transform numbers to big numbers in params
    methodABI.inputs!.forEach((abiInput, idx) => {
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
      function: methodABI.name!,
      paramMap: params,
      argList: args,
    }
  }

  // tslint:disable:no-shadowed-variable
  async getContractMapping(
    address: string,
    selector: string
  ): Promise<ContractMapping | undefined> {
    const fromCore = async (address: Address) => {
      return this.addressMapping.get(address)
    }

    const fromSourcify = async (address: Address) => {
      return this.getContractMappingFromSourcify(address)
    }

    const fromSourcifyAsProxy = async (address: Address) => {
      let implAddress = await tryGetProxyImplementation(this.kit.connection, address)
      if (this.proxyImplementationOverride.has(address)) {
        implAddress = this.proxyImplementationOverride.get(address)
      }
      if (implAddress) {
        return this.getContractMappingFromSourcify(implAddress)
      }
    }

    const strategies = [fromCore, fromSourcify, fromSourcifyAsProxy]

    for (const strategy of strategies) {
      const contractDetails = await strategy(address)
      if (contractDetails && contractDetails.fnMapping.get(selector)) {
        return contractDetails
      }
    }
  }

  async tryParseTxInput(address: string, input: string): Promise<CallDetails | null> {
    const selector = input.slice(0, 10)
    const contractMapping = await this.getContractMapping(address, selector)

    if (contractMapping) {
      const abi = contractMapping.fnMapping.get(selector)
      if (abi) {
        return this.buildCallDetails(contractMapping.details, input, abi)
      } else {
        console.warn(
          `Function with signature ${selector} not found in contract ${contractMapping.details.name}(${address})`
        )
      }
    }
    return null
  }
}
