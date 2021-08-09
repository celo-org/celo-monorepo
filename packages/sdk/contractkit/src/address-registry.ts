import { concurrentMap, objectFromEntries } from '@celo/base'
import { Address, NULL_ADDRESS } from '@celo/base/lib/address'
import debugFactory from 'debug'
import { CeloContract, RegisteredContracts, stripProxy } from './base'
import { newRegistry, Registry } from './generated/Registry'
import { ContractKit } from './kit'
import { UndeployedError } from './web3-contract-cache'

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
    this.registry = newRegistry(kit.connection.web3, REGISTRY_CONTRACT_ADDRESS)
  }

  /**
   * Get the address for a `CeloContract`
   */
  async addressFor(contract: CeloContract): Promise<Address> {
    if (this.cache.has(contract)) {
      return this.cache.get(contract)!
    }

    debug('Fetching address from Registry for %s', contract)
    const address = await this.registry.methods.getAddressForString(stripProxy(contract)).call()

    debug('Fetched address %s', address)
    if (!address || address === NULL_ADDRESS) {
      if (RegisteredContracts.includes(contract)) {
        throw new UndeployedError(contract)
      } else {
        throw new Error(`Failed to get address for ${contract} from the Registry`)
      }
    }

    this.cache.set(contract, address)
    return address
  }

  /**
   * Get the address mapping for known registered contracts
   */
  addressMapping = async (): Promise<{ [key in CeloContract]: string }> =>
    objectFromEntries(
      await concurrentMap(4, RegisteredContracts, async (contract) => {
        try {
          return [contract, await this.addressFor(contract)]
        } catch (e) {
          if (e instanceof UndeployedError) {
            return [contract, e.message]
          }
          throw e
        }
      })
    ) as any
}
