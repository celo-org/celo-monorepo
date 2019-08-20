import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deployerForCoreContract } from '@celo/protocol/lib/web3-utils'
import { GasCurrencyWhitelistInstance } from 'types'

module.exports = deployerForCoreContract<GasCurrencyWhitelistInstance>(
  web3,
  artifacts,
  CeloContractName.GasCurrencyWhitelist
)
