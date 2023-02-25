import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { StableTokenRegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [[], []]
}

module.exports = deploymentForCoreContract<StableTokenRegistryInstance>(
  web3,
  artifacts,
  CeloContractName.StableTokenRegistry,
  initializeArgs
)
