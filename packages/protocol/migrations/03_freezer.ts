/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { FreezerInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return []
}

module.exports = deploymentForCoreContract<FreezerInstance>(
  web3,
  artifacts,
  CeloContractName.Freezer,
  initializeArgs
)
