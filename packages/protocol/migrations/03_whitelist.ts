import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { GasCurrencyWhitelistInstance } from 'types'

module.exports = deploymentForCoreContract<GasCurrencyWhitelistInstance>(
  web3,
  artifacts,
  CeloContractName.GasCurrencyWhitelist
)
