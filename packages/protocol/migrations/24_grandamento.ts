/* tslint:disable:no-console */

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { GrandaMentoInstance, ReserveInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    config.grandaMento.approver,
    toFixed(config.grandaMento.maxApprovalExchangeRateChange).toString(),
    toFixed(config.grandaMento.spread).toString(),
    config.grandaMento.vetoPeriodSeconds,
  ]
}

module.exports = deploymentForCoreContract<GrandaMentoInstance>(
  web3,
  artifacts,
  CeloContractName.GrandaMento,
  initializeArgs,
  async (grandaMento: GrandaMentoInstance) => {
    // Add as a spender of the Reserve
    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    await reserve.addExchangeSpender(grandaMento.address)
  }
)
