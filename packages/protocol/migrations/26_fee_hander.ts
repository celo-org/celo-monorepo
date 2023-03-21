import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { FeeBurnerInstance } from 'types'

//     address _registryAddress,
//     address[] calldata tokens,
//     uint256[] calldata newLimits,
//     uint256[] calldata newMaxSlippages,
//     address[] calldata newRouters

const initializeArgs = async () => {
  return [config.registry.predeployedProxyAddress,
    [],
    [],
    [],
    []
  ]
}

module.exports = deploymentForCoreContract<FeeBurnerInstance>(
  web3,
  artifacts,
  CeloContractName.FeeBurner,
  initializeArgs
)
