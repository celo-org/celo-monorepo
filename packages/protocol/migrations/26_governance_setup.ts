/* tslint:disable:no-console */

import { constitution } from '@celo/protocol/governanceConstitution'
import {
  getDeployedProxiedContract,
  getFunctionSelectorsForContract,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import { GovernanceInstance } from 'types'

module.exports = async (_deployer: any) => {
  const governance: GovernanceInstance = await getDeployedProxiedContract<GovernanceInstance>(
    'Governance',
    artifacts
  )

  console.info('Setting constitution thresholds')
  const constitutionContractNames = Object.keys(constitution).filter(
    (contractName) => contractName !== 'proxy'
  )
  for (const contractName of constitutionContractNames) {
    console.log(`\tSetting constitution thresholds for ${contractName}`)
    const contract: any = await getDeployedProxiedContract<Truffle.ContractInstance>(
      contractName,
      artifacts
    )
    const selectors = getFunctionSelectorsForContract(contract, contractName, artifacts)
    selectors.default = ['0x00000000']
    const thresholds = { ...constitution.proxy, ...constitution[contractName] }
    await Promise.all(
      Object.keys(thresholds).map((func) =>
        Promise.all(
          selectors[func].map((selector) =>
            governance.setConstitution(contract.address, selector, toFixed(thresholds[func]))
          )
        )
      )
    )
  }

  const proxyAndImplementationOwnedByGovernance = [
    'Accounts',
    'Attestations',
    'BlockchainParameters',
    'DoubleSigningSlasher',
    'DowntimeSlasher',
    'Election',
    'EpochRewards',
    'Escrow',
    'Exchange',
    'FeeCurrencyWhitelist',
    'Freezer',
    'GasPriceMinimum',
    'GoldToken',
    'Governance',
    'GovernanceSlasher',
    'LockedGold',
    'Random',
    'Registry',
    'Reserve',
    'SortedOracles',
    'StableToken',
    'Validators',
  ]

  for (const contractName of proxyAndImplementationOwnedByGovernance) {
    await transferOwnershipOfProxyAndImplementation(contractName, governance.address, artifacts)
  }
}
