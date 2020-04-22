import debugFactory from 'debug'
import Web3 from 'web3'
import { Address, AllContracts, CeloContract, NULL_ADDRESS } from './base'
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
      const hash = Web3.utils.soliditySha3({ type: 'string', value: proxyStrippedContract })
      const address = await this.registry.methods.getAddressFor(hash).call()

      debug('Fetched address:  %s = %s', address)
      if (!address || address === NULL_ADDRESS) {
        throw new Error(`Failed to get address for ${contract} from the Registry`)
      }
      this.cache.set(contract, address)
    }
    const cachedAddress = this.cache.get(contract)!
    return cachedAddress
  }

  /**
   * Get the address for all possible `CeloContract`
   */

  async allAddresses(): Promise<Record<CeloContract, Address>> {
    const res: Partial<Record<CeloContract, Address>> = {}
    for (const contract of AllContracts) {
      res[contract] = await this.addressFor(contract)
    }
    return res as Record<CeloContract, Address>
  }
}
