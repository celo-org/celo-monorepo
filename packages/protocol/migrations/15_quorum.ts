/* tslint:disable:no-console */

import { toFixed } from '@celo/protocol/lib/fixidity'
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
    toFixed(config.quorum.participationBaseline).toString(),
    toFixed(config.quorum.participationFloor).toString(),
    toFixed(config.quorum.updateCoefficient).toString(),
    toFixed(config.quorum.criticalBaselineLevel).toString(),
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
