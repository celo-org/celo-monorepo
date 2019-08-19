import { CeloContract } from '@celo/protocol/lib/registry-utils'
import { deployerForCoreContract } from '@celo/protocol/lib/web3-utils'
import { RandomInstance } from 'types'

module.exports = deployerForCoreContract<RandomInstance>(web3, artifacts, CeloContract.Random)
