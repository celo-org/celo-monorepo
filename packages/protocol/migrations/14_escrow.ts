import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
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
  initializeArgs
)
