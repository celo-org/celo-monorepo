import { concurrentMap } from '@celo/base/lib/async'
import { AbiItem, Address } from '@celo/communication'
import { AllContracts, ContractKit } from '@celo/contractkit'

export interface ContractDetails {
  name: string
  address: Address
  jsonInterface: AbiItem[]
}

export async function obtainKitContractDetails(kit: ContractKit): Promise<ContractDetails[]> {
  return concurrentMap(
    5,
    AllContracts.filter((name: any) => name !== 'MultiSig'),
    async (celoContract) => {
      const contract = await kit._web3Contracts.getContract(celoContract)
      return {
        name: celoContract,
        address: contract.options.address,
        jsonInterface: contract.options.jsonInterface,
      }
    }
  )
}

export function mapFromPairs<A, B>(pairs: Array<[A, B]>): Map<A, B> {
  const map = new Map<A, B>()
  pairs.forEach(([k, v]) => {
    map.set(k, v)
  })
  return map
}
