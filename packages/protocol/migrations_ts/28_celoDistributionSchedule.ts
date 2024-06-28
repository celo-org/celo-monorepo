import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { CeloDistributionScheduleInstance } from 'types/08'
import { SOLIDITY_08_PACKAGE } from '../contractPackages'

const initializeArgs = async () => {
  return []
}

module.exports = deploymentForCoreContract<CeloDistributionScheduleInstance>(
  web3,
  artifacts,
  CeloContractName.CeloDistributionSchedule,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)