import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { FeeHandlerInstance, StableTokenInstance } from 'types'

const initializeArgs = async () => {
  return [
    config.registry.predeployedProxyAddress,
    config.registry.feeHandler.beneficiaryAddress,
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
    for (let token of ['StableToken', 'StableTokenEUR', 'StableTokenBRL']) {
      const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
        token,
        artifacts
      )
      await feeHandler.addToken(stableToken.address, feeHandler.address)
    }
  }
)
