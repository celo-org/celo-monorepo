/* tslint:disable:no-console */

import { quorumRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  setInRegistry,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { QuorumInstance, RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.quorum.initialQuorumNumerator,
    config.quorum.initialQuorumDenominator,
    config.quorum.quorumFloorNumerator,
    config.quorum.quorumFloorDenominator,
  ]
}

module.exports = deployProxyAndImplementation<QuorumInstance>(
  web3,
  artifacts,
  'Quorum',
  initializeArgs,
  async (quorum: QuorumInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )

    await setInRegistry(quorum, registry, quorumRegistryId)
  }
)
