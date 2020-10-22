import { Address } from '@celo/base/lib/address'
import { concurrentMap } from '@celo/base/lib/async'
import { ABIDefinition } from 'web3-eth-abi'
import { CeloContract, RegisteredContracts } from '../base'
import { ContractKit } from '../kit'

export interface ContractDetails {
  name: string
  address: Address
  jsonInterface: ABIDefinition[]
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
    jsonInterface: contract.options.jsonInterface as any, // TODO fix types
  }
}

export async function obtainKitContractDetails(kit: ContractKit): Promise<ContractDetails[]> {
  return concurrentMap(5, RegisteredContracts, (celoContract) =>
    getContractDetailsFromContract(kit, celoContract)
  )
}

export function mapFromPairs<A, B>(pairs: Array<[A, B]>): Map<A, B> {
  const map = new Map<A, B>()
  pairs.forEach(([k, v]) => {
    map.set(k, v)
  })
  return map
}
