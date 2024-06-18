import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { MintCeloScheduleInstance } from 'types/08'
import { SOLIDITY_08_PACKAGE } from '../contractPackages'

const initializeArgs = async () => {
  return []
}

module.exports = deploymentForCoreContract<MintCeloScheduleInstance>(
  web3,
  artifacts,
  CeloContractName.MintCeloSchedule,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
