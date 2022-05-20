/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { StableTokenRegistryInstance } from 'types'

// Add initializeArgs when trying to deploy a the registry with a new stable asset on the test net

module.exports = deploymentForCoreContract<StableTokenRegistryInstance>(
  web3,
  artifacts,
  CeloContractName.StableTokenRegistry
)
