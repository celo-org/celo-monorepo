import { Address, NULL_ADDRESS } from '@celo/base/lib/address'
import debugFactory from 'debug'
import { CeloContract, RegisteredContracts, stripProxy } from './base'
import { newRegistry, Registry } from './generated/Registry'
import { ContractKit } from './kit'

const debug = debugFactory('kit:registry')

// Registry contract is always predeployed to this address
export const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'

export class UnregisteredError extends Error {
  constructor(contract: CeloContract) {
    super(`${contract} not (yet) registered`)
  }
}

/**
 * Celo Core Contract's Address Registry
 */
export class AddressRegistry {
  private readonly registry: Registry
  private readonly cache: Map<CeloContract, Address> = new Map()

  constructor(kit: ContractKit) {
    this.cache.set(CeloContract.Registry, REGISTRY_CONTRACT_ADDRESS)
    this.registry = newRegistry(kit.connection.web3, REGISTRY_CONTRACT_ADDRESS)
  }

  /**
   * Get the address for a `CeloContract`
   */
  async addressFor(contract: CeloContract): Promise<Address> {
    if (!this.cache.has(contract)) {
      debug('Fetching address from Registry for %s', contract)
      const address = await this.registry.methods.getAddressForString(stripProxy(contract)).call()

      debug('Fetched address %s', address)
      if (!address || address === NULL_ADDRESS) {
        throw new UnregisteredError(contract)
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
    await Promise.all(
      RegisteredContracts.map(async (contract) => {
        try {
          await this.addressFor(contract)
        } catch (e) {
          debug(e)
        }
      })
    )
    return this.cache
  }
}
