import { CeloContract } from '@celo/protocol/lib/registry-utils'
import { deployerForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { EscrowInstance } from 'types'

module.exports = deployerForCoreContract<EscrowInstance>(
  web3,
  artifacts,
  CeloContract.Escrow,
  async () => [config.registry.predeployedProxyAddress]
)
