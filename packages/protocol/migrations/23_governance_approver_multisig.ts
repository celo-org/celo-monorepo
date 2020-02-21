import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForProxiedContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { GovernanceApproverMultiSigInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.governanceApproverMultiSig.signatories,
    config.governanceApproverMultiSig.numRequiredConfirmations,
  ]
}

module.exports = deploymentForProxiedContract<GovernanceApproverMultiSigInstance>(
  web3,
  artifacts,
  CeloContractName.GovernanceApproverMultiSig,
  initializeArgs
)
