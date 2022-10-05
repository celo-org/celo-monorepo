import { concurrentMap } from '@celo/base/lib/async'
import { AbiItem, Address } from '@celo/connect'
import { CeloContract, ContractKit } from '@celo/contractkit'

export interface ContractDetails {
  name: string
  address: Address
  jsonInterface: AbiItem[]
}

export const getContractDetailsFromContract = async (
  kit: ContractKit,
  celoContract: CeloContract,
  address?: string
) => {
  const contract = await kit._web3Contracts.getContract(celoContract, address)
  return {
    name: celoContract,
    address: address ?? contract.options.address,
    jsonInterface: contract.options.jsonInterface,
  }
}

export async function obtainKitContractDetails(kit: ContractKit): Promise<ContractDetails[]> {
  const registry = await kit.registry.addressMapping()
  return concurrentMap(5, Array.from(registry.entries()), ([celoContract, address]) =>
    getContractDetailsFromContract(kit, celoContract, address)
  )
}

export function mapFromPairs<A, B>(pairs: Array<[A, B]>): Map<A, B> {
  const map = new Map<A, B>()
  pairs.forEach(([k, v]) => {
    map.set(k, v)
  })
  return map
}
