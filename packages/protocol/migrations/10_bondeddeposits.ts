import { CeloContract } from '@celo/protocol/lib/registry-utils'
import { deployerForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { BondedDepositsInstance } from 'types'

module.exports = deployerForCoreContract<BondedDepositsInstance>(
  web3,
  artifacts,
  CeloContract.BondedDeposits,
  async () => [config.registry.predeployedProxyAddress, config.bondedDeposits.maxNoticePeriod]
)
