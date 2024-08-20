import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { RegistryInstance } from '@celo/protocol/types'
import { CeloUnreleasedTreasureInstance } from 'types/08'
import { SOLIDITY_08_PACKAGE } from '../contractPackages'

const initializeArgs = async (): Promise<[string]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [registry.address]
}

module.exports = deploymentForCoreContract<CeloUnreleasedTreasureInstance>(
  web3,
  artifacts,
  CeloContractName.CeloUnreleasedTreasure,
  initializeArgs,
  undefined,
  SOLIDITY_08_PACKAGE
)
