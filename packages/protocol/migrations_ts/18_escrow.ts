import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { EscrowInstance } from 'types/08'

module.exports = deploymentForCoreContract<EscrowInstance>(
  web3,
  artifacts,
  CeloContractName.Escrow,
  async () => [],
  undefined,
  SOLIDITY_08_PACKAGE
)
