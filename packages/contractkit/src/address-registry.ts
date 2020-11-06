import { zip } from '@celo/base/lib/collections'
import debugFactory from 'debug'
import { Address, CeloContract, NULL_ADDRESS, RegisteredContracts } from './base'
import { newRegistry, Registry } from './generated/Registry'
import { ContractKit } from './kit'

const debug = debugFactory('kit:registry')

// Registry contract is always predeployed to this address
const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'

/**
 * Celo Core Contract's Address Registry
 */
export class AddressRegistry {
  private readonly registry: Registry
  private readonly cache: Map<CeloContract, Address> = new Map()

  constructor(kit: ContractKit) {
    this.cache.set(CeloContract.Registry, REGISTRY_CONTRACT_ADDRESS)
    this.registry = newRegistry(kit.web3, REGISTRY_CONTRACT_ADDRESS)
  }

  /**
   * Get the address for a `CeloContract`
   */
  async addressFor(contract: CeloContract): Promise<Address> {
    if (!this.cache.has(contract)) {
      const proxyStrippedContract = contract.replace('Proxy', '') as CeloContract
      debug('Fetching address from Registry for %s', contract)
      const address = await this.registry.methods.getAddressForString(proxyStrippedContract).call()

      debug('Fetched address %s', address)
      if (!address || address === NULL_ADDRESS) {
        throw new Error(`Failed to get address for ${contract} from the Registry`)
      }
      this.cache.set(contract, address)
    }
    const cachedAddress = this.cache.get(contract)!
    return cachedAddress
  }

  /**
   * Get the address mapping for known registered contracts
   */
  async addressMapping() {
    const addresses = await Promise.all(RegisteredContracts.map((r) => this.addressFor(r)))
    return new Map(zip((r, a) => [r, a], RegisteredContracts, addresses))
  }
}
