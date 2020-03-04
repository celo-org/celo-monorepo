import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract, transferOwnershipOfProxy } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { GovernanceApproverMultiSigInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.governanceApproverMultiSig.signatories,
    config.governanceApproverMultiSig.numRequiredConfirmations,
    config.governanceApproverMultiSig.numInternalRequiredConfirmations,
  ]
}

// TODO @amyslawson has to register address for contractKit -- see if this is necessary
module.exports = deploymentForCoreContract<GovernanceApproverMultiSigInstance>(
  web3,
  artifacts,
  CeloContractName.GovernanceApproverMultiSig,
  initializeArgs,
  async (governanceApproverMultiSig: GovernanceApproverMultiSigInstance) => {
    await transferOwnershipOfProxy(
      CeloContractName.GovernanceApproverMultiSig,
      governanceApproverMultiSig.address,
      artifacts
    )
  }
)
