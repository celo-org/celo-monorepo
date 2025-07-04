import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { ScoreManagerInstance } from 'types/08'

const initializeArgs = async (): Promise<any[]> => {
  return []
}

module.exports = deploymentForCoreContract<ScoreManagerInstance>(
  web3,
  artifacts,
  CeloContractName.ScoreManager,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
