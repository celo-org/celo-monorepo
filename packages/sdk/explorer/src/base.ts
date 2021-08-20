import { concurrentMap } from '@celo/base/lib/async'
import { AbiItem, Address } from '@celo/connect'
import { CeloContract, ContractKit, RegisteredContracts } from '@celo/contractkit'

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

export type AddressOverride = { [key in CeloContract]?: string }
export async function obtainKitContractDetails(
  kit: ContractKit,
  addressOverride: AddressOverride = {}
): Promise<ContractDetails[]> {
  return concurrentMap(5, RegisteredContracts, (celoContract) =>
    getContractDetailsFromContract(kit, celoContract, addressOverride[celoContract])
  )
}

export function mapFromPairs<A, B>(pairs: Array<[A, B]>): Map<A, B> {
  const map = new Map<A, B>()
  pairs.forEach(([k, v]) => {
    map.set(k, v)
  })
  return map
}
