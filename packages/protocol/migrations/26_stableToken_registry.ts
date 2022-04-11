/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { StableTokenRegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.StableTokenRegistry.existingFiatTickers,
    config.StableTokenRegistry.existingStableTokenContractNames,
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
