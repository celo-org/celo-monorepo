import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/src/fixidity'
import { FeeHandlerInstance, MentoFeeHandlerSellerInstance, StableTokenInstance } from 'types'

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
      const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
        token,
        artifacts
      )

      const mentoFeeHandlerSeller: MentoFeeHandlerSellerInstance = await getDeployedProxiedContract<MentoFeeHandlerSellerInstance>(
        CeloContractName.MentoFeeHandlerSeller,
        artifacts
      )

      await feeHandler.addToken(stableToken.address, mentoFeeHandlerSeller.address)
    }
  }
)
