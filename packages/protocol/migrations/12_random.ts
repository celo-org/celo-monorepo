import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { RandomInstance } from 'types'

module.exports = deploymentForCoreContract<RandomInstance>(web3, artifacts, CeloContractName.Random)
