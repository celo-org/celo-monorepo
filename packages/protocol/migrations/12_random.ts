import { randomRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  setInRegistry,
} from '@celo/protocol/lib/web3-utils'
import { RandomInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return []
}

module.exports = deployProxyAndImplementation<RandomInstance>(
  web3,
  artifacts,
  'Random',
  initializeArgs,
  async (random: RandomInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )
    await setInRegistry(random, registry, randomRegistryId)
  }
)
