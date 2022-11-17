/**
 * Sourcify (https://sourcify.dev/) helpers for querying
 * contract metadata when it's available.
 *
 * @example
 * Get the ABI of an arbitrary contract.
 * ```ts
 * const metadata = fetchMetadata('42220', '0xF27c7D717B4b7CaD2833a61cb9CA7B61021f9F73')
 * if (metadata.abi !== null) {
 *  // do something with it.
 * }
 */
import { AbiCoder, AbiItem, Address } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import fetch from 'cross-fetch'

const PROXY_IMPLEMENTATION_GETTERS = [
  '_getImplementation',
  'getImplementation',
  '_implementation',
  'implementation',
]

const PROXY_ABI: AbiItem[] = PROXY_IMPLEMENTATION_GETTERS.map((funcName) => ({
  constant: true,
  inputs: [],
  name: funcName,
  outputs: [
    {
      internalType: 'address',
      name: 'implementation',
      type: 'address',
    },
  ],
  payable: false,
  stateMutability: 'view',
  type: 'function',
}))

/**
 * MetadataResponse interface for the `metadata.json` file that the sourcify repo returns.
 * All fields are optional because we don't really _know_ what we get from the API, thus
 * we need to enforce the structure at runtime.
 */
export interface MetadataResponse {
  output?: {
    abi?: AbiItem[]
  }
  settings?: {
    compilationTarget?: Record<string, string>
  }
}

/**
 * Wrapper class for a metadata.json response from sourcify.
 * Because the response's true structure is unknown this wrapper implements
 * light runtime verification.
 */
export class Metadata {
  public abi: AbiItem[] | null = null
  public contractName: string | null = null

  private abiCoder: AbiCoder
  private jsonInterfaceMethodToString: (item: AbiItem) => string
  private kit: ContractKit
  private address: Address

  constructor(kit: ContractKit, address: Address, response: any) {
    this.response = response as MetadataResponse
    this.abiCoder = kit.connection.getAbiCoder()
    // XXX: For some reason this isn't exported as it should be
    // @ts-ignore
    this.jsonInterfaceMethodToString = kit.web3.utils._jsonInterfaceMethodToString
    this.kit = kit
    this.address = address
  }

  set response(value: MetadataResponse) {
    if (
      typeof value === 'object' &&
      typeof value.output === 'object' &&
      'abi' in value.output &&
      Array.isArray(value.output.abi) &&
      value.output.abi.length > 0
    ) {
      this.abi = value.output.abi
    }

    if (
      typeof value === 'object' &&
      typeof value.settings === 'object' &&
      typeof value.settings.compilationTarget === 'object' &&
      Object.values(value.settings.compilationTarget).length > 0
    ) {
      // XXX: Not sure when there are multiple compilationTargets and what should
      // happen then but defaulting to this for now.
      const contracts = Object.values(value.settings.compilationTarget)
      this.contractName = contracts[0]
    }
  }

  /**
   * Find the AbiItem for a given function selector
   * @param selector the 4-byte selector of the function call
   * @returns an AbiItem if found or null
   */
  abiForSelector(selector: string): AbiItem | null {
    return (
      this.abi?.find((item) => {
        return item.type === 'function' && this.abiCoder.encodeFunctionSignature(item) === selector
      }) || null
    )
  }

  /**
   * Find the AbiItem for methods that match the provided method name.
   * The function can return more than one AbiItem if the query string
   * provided doesn't contain arguments as there can be multiple
   * definitions with different arguments.
   * @param method name of the method to lookup
   * @returns and array of AbiItems matching the query
   */
  abiForMethod(query: string): AbiItem[] {
    if (query.indexOf('(') >= 0) {
      // Method is a full call signature with arguments
      return (
        this.abi?.filter((item) => {
          return item.type === 'function' && this.jsonInterfaceMethodToString(item) === query
        }) || []
      )
    } else {
      // Method is only method name
      return (
        this.abi?.filter((item) => {
          return item.type === 'function' && item.name === query
        }) || []
      )
    }
  }

  /**
   * Use heuristics to determine if the contract can be a proxy
   * and extract the implementation.
   * Available scenarios:
   * - _getImplementation() exists
   * - getImplementation() exists
   * - _implementation() exists
   * - implementation() exists
   * @returns the implementation address or null
   */
  async tryGetProxyImplementation(): Promise<Address | null> {
    const proxyContract = new this.kit.web3.eth.Contract(PROXY_ABI, this.address)
    for (const fn of PROXY_IMPLEMENTATION_GETTERS) {
      try {
        return await new Promise((resolve, reject) => {
          proxyContract.methods[fn]().call().then(resolve).catch(reject)
        })
      } catch {
        continue
      }
    }

    return null
  }
}

/**
 * Fetch the sourcify response and instantiate a Metadata wrapper class around it.
 * Try a full_match but fallback to partial_match when not strict.
 * @param kit ContractKit instance
 * @param contract the address of the contract to query
 * @param strict only allow full matches https://docs.sourcify.dev/docs/full-vs-partial-match/
 * @returns Metadata or null
 */
export async function fetchMetadata(
  kit: ContractKit,
  contract: Address,
  strict = false
): Promise<Metadata | null> {
  const fullMatchMetadata = await querySourcify(kit, 'full_match', contract)
  if (fullMatchMetadata !== null) {
    return fullMatchMetadata
  } else if (strict) {
    return null
  } else {
    return querySourcify(kit, 'partial_match', contract)
  }
}

/**
 * Fetch the sourcify response and instantiate a Metadata wrapper class around it.
 * @param kit ContractKit instance
 * @param matchType what type of match to query for https://docs.sourcify.dev/docs/full-vs-partial-match/
 * @param contract the address of the contract to query
 * @returns Metadata or null
 */
async function querySourcify(
  kit: ContractKit,
  matchType: 'full_match' | 'partial_match',
  contract: Address
): Promise<Metadata | null> {
  const chainID = await kit.connection.chainId()
  const resp = await fetch(
    `https://repo.sourcify.dev/contracts/${matchType}/${chainID}/${contract}/metadata.json`
  )
  if (resp.ok) {
    return new Metadata(kit, contract, await resp.json())
  }
  return null
}
