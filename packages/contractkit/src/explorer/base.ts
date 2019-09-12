import { Address } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { ABIDefinition } from 'web3/eth/abi'
import { AllContracts } from '../base'
import { ContractKit } from '../kit'

export interface ContractDetails {
  name: string
  address: Address
  jsonInterface: ABIDefinition[]
}

export async function obtainKitContractDetails(kit: ContractKit) {
  return concurrentMap(5, AllContracts, async (celoContract) => {
    const contract = await kit._web3Contracts.getContract(celoContract)
    return {
      name: celoContract,
      address: contract.options.address,
      jsonInterface: contract.options.jsonInterface,
    }
  })
}

export function mapFromPairs<A, B>(pairs: Array<[A, B]>): Map<A, B> {
  const map = new Map<A, B>()
  pairs.forEach(([k, v]) => {
    map.set(k, v)
  })
  return map
}
