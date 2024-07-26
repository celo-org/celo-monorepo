import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { FeeCurrencyWhitelistInstance } from 'types/08'

module.exports = deploymentForCoreContract<FeeCurrencyWhitelistInstance>(
  web3,
  artifacts,
  CeloContractName.FeeCurrencyWhitelist
)
