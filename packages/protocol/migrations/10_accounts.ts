import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { AccountsInstance } from 'types'

module.exports = deploymentForCoreContract<AccountsInstance>(
  web3,
  artifacts,
  CeloContractName.Accounts
)
