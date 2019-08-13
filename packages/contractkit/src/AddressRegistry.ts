import { newRegistry } from 'src/generated/Registry'
import { Registry } from 'src/generated/types/Registry'
import { Address, CeloContract } from './base'
import { ContractKit } from './kit'

// Registry contract is always predeployed to this address
const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'

// This is what's returned from the registry when a contract isn't found
const ADDRESS_NOT_FOUND = '0x0000000000000000000000000000000000000000'

export class AddressRegistry {
  private readonly registry: Registry
  private readonly cache: Map<CeloContract, Address> = new Map()

  constructor(readonly kit: ContractKit) {
    this.cache.set(CeloContract.Registry, REGISTRY_CONTRACT_ADDRESS)
    this.registry = newRegistry(kit.web3, REGISTRY_CONTRACT_ADDRESS)
  }

  async addressFor(contract: CeloContract): Promise<Address> {
    if (!this.cache.has(contract)) {
      const address = await this.registry.methods.getAddressFor(contract).call()

      if (!address || address === ADDRESS_NOT_FOUND) {
        throw new Error(`Failed to get address for ${contract} from the Registry`)
      }
      this.cache.set(contract, address)
    }
    return this.cache.get(contract)!
  }

  // async allAddresses(): Promise<Map<CeloContract, Address>> {
  //   const AllContracts = Object.keys(CeloContract).map((contract) => {
  //     if (typeof contract === string) {
  //       return CeloContract[contract]
  //     }
  //   }) as CeloContract[]
  //   AllContracts.forEach(async (contract) => {
  //     await this.addressFor(contract)
  //   })
  // }
}
