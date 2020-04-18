/* tslint:disable:no-console */
import {
  getDeployedProxiedContract,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { BlockchainParametersInstance, GovernanceInstance } from 'types'
import { config } from '@celo/protocol/migrationsConfig'

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
    const governance = await getDeployedProxiedContract<GovernanceInstance>('Governance', artifacts)
    if (true) {
      //if (!config.governance.skipTransferOwnership) {
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
