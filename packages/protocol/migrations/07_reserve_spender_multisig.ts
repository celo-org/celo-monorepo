import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract, transferOwnershipOfProxy } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ReserveSpenderMultiSigInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.reserveSpenderMultiSig.signatories,
    config.reserveSpenderMultiSig.numRequiredConfirmations,
    config.reserveSpenderMultiSig.numInternalRequiredConfirmations,
  ]
}

//TODO @amyslawson has to register address for contractKit -- see if this is necessary
module.exports = deploymentForCoreContract<ReserveSpenderMultiSigInstance>(
  web3,
  artifacts,
  CeloContractName.ReserveSpenderMultiSig,
  initializeArgs,
  async (reserveSpenderMultiSig: ReserveSpenderMultiSigInstance) => {
    await transferOwnershipOfProxy(
      CeloContractName.ReserveSpenderMultiSig,
      reserveSpenderMultiSig.address,
      artifacts
    )
  }
)
