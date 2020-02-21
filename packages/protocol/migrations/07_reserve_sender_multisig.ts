import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForProxiedContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ReserveSpenderMultiSigInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.reserveSpenderMultiSig.signatories,
    config.reserveSpenderMultiSig.numRequiredConfirmations,
  ]
}

module.exports = deploymentForProxiedContract<ReserveSpenderMultiSigInstance>(
  web3,
  artifacts,
  CeloContractName.ReserveSpenderMultiSig,
  initializeArgs
)
