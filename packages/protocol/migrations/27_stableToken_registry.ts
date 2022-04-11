/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { RegistryInstance, StableTokenRegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [
    config.stableTokenRegistry.fiatTicker,
    config.stableTokenRegistry.stableTokenContractName,
    registry.address,
  ]
}

module.exports = deploymentForCoreContract<StableTokenRegistryInstance>(
  web3,
  artifacts,
  CeloContractName.StableTokenRegistry,
  initializeArgs,
  // tslint:disable-next-line: no-empty
  async (_StableTokenRegistry: StableTokenRegistryInstance) => {}
)
