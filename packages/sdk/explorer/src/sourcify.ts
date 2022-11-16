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
import { AbiCoder, AbiItem, Address, Contract } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import fetch from 'cross-fetch'

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
 * Wrapper class for a Metadata response from sourcify.
 * Because these response's true structure is unknown this wrapper implements
 * runtime guards and getters.
 */
export class Metadata {
  public abi: AbiItem[] | null = null
  public contractName: string | null = null

  private contract: Contract | null = null
  private abiCoder: AbiCoder

  constructor(kit: ContractKit, address: Address, response: any) {
    this.response = response as MetadataResponse
    this.abiCoder = kit.connection.getAbiCoder()

    if (this.abi) {
      this.contract = new kit.web3.eth.Contract(this.abi, address)
    }
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

  abiForSignature(callSignature: string): AbiItem | null {
    if (this.abi) {
      for (const item of this.abi) {
        if (
          item.type == 'function' &&
          this.abiCoder.encodeFunctionSignature(item) == callSignature
        ) {
          return item
        }
      }
    }
    return null
  }

  isProxy(): boolean {
    // todo(bogdan): Improve this to support multiple proxy types, like EIP-1167
    return this.contract?.methods.getImplementation !== undefined
  }

  async getProxyImplementation(): Promise<Address | null> {
    if (this.contract) {
      return this.contract.methods.getImplementation.call()
    }
    return null
  }
}

/**
 * Fetch the sourcify response and instantiate a Metadata wrapper class around it.
 * Try a full_match but fallback to partial_match when not strict.
 * @param chainID the chainID to query
 * @param contract the address of the contract to query
 * @param strict only allow full matches https://docs.sourcify.dev/docs/full-vs-partial-match/
 * @returns Metadata or null
 */
export async function fetchMetadata(
  kit: ContractKit,
  chainID: string | number,
  contract: Address,
  strict = false
): Promise<Metadata | null> {
  const fullMatchMetadata = await querySourcify(kit, 'full_match', chainID, contract)
  if (fullMatchMetadata !== null) {
    return fullMatchMetadata
  } else if (strict) {
    return null
  } else {
    return querySourcify(kit, 'partial_match', chainID, contract)
  }
}

/**
 * Fetch the sourcify response and instantiate a Metadata wrapper class around it.
 * @param matchType what type of match to query for https://docs.sourcify.dev/docs/full-vs-partial-match/
 * @param chainID the chainID to query
 * @param contract the address of the contract to query
 * @returns Metadata or null
 */
async function querySourcify(
  kit: ContractKit,
  matchType: 'full_match' | 'partial_match',
  chainID: string | number,
  contract: Address
): Promise<Metadata | null> {
  const resp = await fetch(
    `https://repo.sourcify.dev/contracts/${matchType}/${chainID}/${contract}/metadata.json`
  )
  if (resp.ok) {
    return new Metadata(kit, contract, await resp.json())
  }
  return null
}
