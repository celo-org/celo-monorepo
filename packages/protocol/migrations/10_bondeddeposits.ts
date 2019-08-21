import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { BondedDepositsInstance } from 'types'

module.exports = deploymentForCoreContract<BondedDepositsInstance>(
  web3,
  artifacts,
  CeloContractName.BondedDeposits,
  async () => [config.registry.predeployedProxyAddress, config.bondedDeposits.maxNoticePeriod]
)
