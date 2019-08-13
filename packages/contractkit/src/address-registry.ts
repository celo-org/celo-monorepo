// import { Registry } from 'contracts'
import { Registry } from 'types/Registry'
// import Web3 from 'web3'

type Address = string

export enum CeloContract {
  GoldToken = 'GoldToken',
  Registry = 'Registry',
  StableToken = 'StableToken',
}

// Registry contract is always pre-deployed to this address
const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'
const ADDRESS_NOT_FOUND = '0x0000000000000000000000000000000000000000'

// The AddressRegistry manages the contract addresses for a given network
export class AddressRegistry {
  private readonly cache: Map<CeloContract, Address> = new Map()
  // private readonly web3: Web3
  private readonly registry: Registry

  // constructor(private readonly celoWeb3: Web3) {
  constructor(registry: Registry) {
    // this.web3 = celoWeb3
    this.cache.set(CeloContract.Registry, REGISTRY_CONTRACT_ADDRESS)

    // TODO: This should be replaced with our new way of creating contracts from the address
    this.registry = registry
  }

  async getAddressFor(contract: CeloContract): Promise<Address> {
    if (!this.cache.has(contract)) {
      const address = await this.registry.methods.getAddressFor(contract).call()
      console.debug(address)

      if (!address || address === ADDRESS_NOT_FOUND) {
        throw new Error(`Failed to get address for ${contract} from the Registry`)
      }
      this.cache.set(contract, address)
    }
    return this.cache.get(contract)!
  }
}
