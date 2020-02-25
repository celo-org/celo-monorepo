/* tslint:disable:no-console */

import { constitution } from '@celo/protocol/governanceConstitution'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
  getFunctionSelectorsForContract,
  transferOwnershipOfProxy,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { GovernanceInstance, ReserveInstance } from 'types'

const initializeArgs = async (networkName: string): Promise<any[]> => {
  const approver = require('@celo/protocol/truffle-config.js').networks[networkName].from

  return [
    config.registry.predeployedProxyAddress,
    approver,
    config.governance.concurrentProposals,
    web3.utils.toWei(config.governance.minDeposit.toString(), 'ether'),
    config.governance.queueExpiry,
    config.governance.dequeueFrequency,
    config.governance.approvalStageDuration,
    config.governance.referendumStageDuration,
    config.governance.executionStageDuration,
    toFixed(config.governance.participationBaseline).toString(),
    toFixed(config.governance.participationBaselineFloor).toString(),
    toFixed(config.governance.participationBaselineUpdateFactor).toString(),
    toFixed(config.governance.participationBaselineQuorumFactor).toString(),
  ]
}

module.exports = deploymentForCoreContract<GovernanceInstance>(
  web3,
  artifacts,
  CeloContractName.Governance,
  initializeArgs,
  async (governance: GovernanceInstance) => {
    console.info('Setting Governance as a Reserve spender')
    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    await reserve.addSpender(governance.address)

    console.info('Setting constitution thresholds')
    await Promise.all(
      Object.keys(constitution)
        .filter((contractName) => contractName !== 'proxy')
        .map(async (contractName) => {
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
        })
    )

    const proxyOwnedByGovernance = ['GoldToken']
    await Promise.all(
      proxyOwnedByGovernance.map((contractName) =>
        transferOwnershipOfProxy(contractName, governance.address, artifacts)
      )
    )

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
      'GasPriceMinimum',
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

    await Promise.all(
      proxyAndImplementationOwnedByGovernance.map((contractName) =>
        transferOwnershipOfProxyAndImplementation(contractName, governance.address, artifacts)
      )
    )
  }
)
