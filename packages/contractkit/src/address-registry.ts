import debugFactory from 'debug'
import { Address, AllContracts, CeloContract, NULL_ADDRESS } from './base'
import { newRegistry } from './generated/Registry'
import { Registry } from './generated/types/Registry'
import { ContractKit } from './kit'

const debug = debugFactory('kit:registry')

// Registry contract is always predeployed to this address
const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'

export class AddressRegistry {
  private readonly registry: Registry
  private readonly cache: Map<CeloContract, Address> = new Map()

  constructor(kit: ContractKit) {
    this.cache.set(CeloContract.Registry, REGISTRY_CONTRACT_ADDRESS)
    this.registry = newRegistry(kit.web3, REGISTRY_CONTRACT_ADDRESS)
  }

  async addressFor(contract: CeloContract): Promise<Address> {
    if (!this.cache.has(contract)) {
      const address = await this.registry.methods.getAddressFor(contract).call()

      if (!address || address === NULL_ADDRESS) {
        throw new Error(`Failed to get address for ${contract} from the Registry`)
      }
      this.cache.set(contract, address)
    }
    const cachedAddress = this.cache.get(contract)!
    debug('Getting Address for %O = %s', contract, cachedAddress)
    return cachedAddress
  }

  async allAddresses(): Promise<Record<CeloContract, Address>> {
    const res: Partial<Record<CeloContract, Address>> = {}
    for (const contract of AllContracts) {
      res[contract] = await this.addressFor(contract)
    }
    return res as Record<CeloContract, Address>
  }
}
