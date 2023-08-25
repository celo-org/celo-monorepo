/* tslint:disable:no-console */
import {
  getDeployedProxiedContract,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { BlockchainParametersInstance, GovernanceInstance } from 'types'

/*
 * A simple script to set the block gas limit after migrations
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const bcp = await getDeployedProxiedContract<BlockchainParametersInstance>(
      'BlockchainParameters',
      artifacts
    )
    console.log('Setting block gas limit to', config.blockchainParameters.blockGasLimit)
    await bcp.setBlockGasLimit(config.blockchainParameters.blockGasLimit)
    if (!config.governance.skipTransferOwnership) {
      const governance = await getDeployedProxiedContract<GovernanceInstance>(
        'Governance',
        artifacts
      )
      await transferOwnershipOfProxyAndImplementation(
        'BlockchainParameters',
        governance.address,
        artifacts
      )
    }
    callback()
  } catch (error) {
    callback(error)
  }
}
