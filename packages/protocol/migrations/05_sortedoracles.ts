/* tslint:disable:no-console */
import { CeloContract } from '@celo/protocol/lib/registry-utils'
import { deployerForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { SortedOraclesInstance } from 'types'

module.exports = deployerForCoreContract<SortedOraclesInstance>(
  web3,
  artifacts,
  CeloContract.SortedOracles,
  async () => [config.oracles.reportExpiry]
)
