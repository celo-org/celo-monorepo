import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { SortedOraclesInstance } from 'types'

module.exports = deploymentForCoreContract<SortedOraclesInstance>(
  web3,
  artifacts,
  CeloContractName.SortedOracles,
  async () => [config.oracles.reportExpiry]
)
