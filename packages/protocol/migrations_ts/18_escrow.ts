import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { EscrowInstance } from 'types'

module.exports = deploymentForCoreContract<EscrowInstance>(
  web3,
  artifacts,
  CeloContractName.Escrow,
  async () => []
)
