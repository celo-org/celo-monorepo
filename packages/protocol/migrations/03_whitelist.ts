import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { FeeCurrencyWhitelistInstance } from 'types'
import { config } from '@celo/protocol/migrationsConfig'

const initializeArgs = async (): Promise<any[]> => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<FeeCurrencyWhitelistInstance>(
  web3,
  artifacts,
  CeloContractName.FeeCurrencyWhitelist,
  initializeArgs
)
