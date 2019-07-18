import { bondedDepositsRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { BondedDepositsInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [registry.address, config.bondedDeposits.maxNoticePeriod]
}

module.exports = deployProxyAndImplementation<BondedDepositsInstance>(
  web3,
  artifacts,
  'BondedDeposits',
  initializeArgs,
  async (bondedDeposits: BondedDepositsInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )
    await registry.setAddressFor(bondedDepositsRegistryId, bondedDeposits.address)
  }
)
