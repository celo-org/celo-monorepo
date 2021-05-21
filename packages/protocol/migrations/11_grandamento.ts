/* tslint:disable:no-console */

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { GrandaMentoInstance, ReserveInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return []
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
