/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { GoldTokenInstance } from 'types'
import { config } from '@celo/protocol/migrationsConfig'

const initializeArgs = async () => {
  return [config.registry.predeployedProxyAddress]
}

module.exports = deploymentForCoreContract<GoldTokenInstance>(
  web3,
  artifacts,
  CeloContractName.GoldToken,
  initializeArgs
)
