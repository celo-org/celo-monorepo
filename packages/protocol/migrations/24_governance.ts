/* tslint:disable:no-console */

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
  transferOwnershipOfProxy,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { GovernanceInstance, GovernanceApproverMultiSigInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  const governanceApproverMultiSig: GovernanceApproverMultiSigInstance = await getDeployedProxiedContract<
    GovernanceApproverMultiSigInstance
  >(CeloContractName.GovernanceApproverMultiSig, artifacts)

  return [
    config.registry.predeployedProxyAddress,
    governanceApproverMultiSig.address,
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
