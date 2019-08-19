import { escrowRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  setInRegistry,
} from '@celo/protocol/lib/web3-utils'
import { EscrowInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<[string]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [registry.address]
}

module.exports = deployProxyAndImplementation<EscrowInstance>(
  web3,
  artifacts,
  'Escrow',
  initializeArgs,
  async (escrow: EscrowInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )
    await setInRegistry(escrow, registry, escrowRegistryId)
  }
)
