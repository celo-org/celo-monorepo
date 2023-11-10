import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { FeeHandlerInstance, MentoFeeHandlerSellerInstance } from 'types'
import { StableTokenInstance } from 'types/mento'
import { MENTO_PACKAGE } from '../contractPackages'
import { ArtifactsSingleton } from '../lib/artifactsSingleton'

const initializeArgs = async () => {
  return [
    config.registry.predeployedProxyAddress,
    config.feeHandler.beneficiaryAddress,
    toFixed(config.feeHandler.burnFraction).toString(),
    [],
    [],
    [],
    [],
  ]
}

module.exports = deploymentForCoreContract<FeeHandlerInstance>(
  web3,
  artifacts,
  CeloContractName.FeeHandler,
  initializeArgs,
  async (feeHandler: FeeHandlerInstance) => {
    for (const token of ['StableToken', 'StableTokenEUR', 'StableTokenBRL']) {
      const stableToken: StableTokenInstance =
        await getDeployedProxiedContract<StableTokenInstance>(
          token,
          ArtifactsSingleton.getInstance(MENTO_PACKAGE)
        )

      const mentoFeeHandlerSeller: MentoFeeHandlerSellerInstance =
        await getDeployedProxiedContract<MentoFeeHandlerSellerInstance>(
          CeloContractName.MentoFeeHandlerSeller,
          artifacts
        )

      await feeHandler.addToken(stableToken.address, mentoFeeHandlerSeller.address)
    }
  }
)
