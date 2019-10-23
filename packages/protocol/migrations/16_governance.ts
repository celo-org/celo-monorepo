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

    const proxyOwnedByGovernance = ['GoldToken', 'Random']
    await Promise.all(
      proxyOwnedByGovernance.map((contractName) =>
        transferOwnershipOfProxy(contractName, governance.address, artifacts)
      )
    )

    const proxyAndImplementationOwnedByGovernance = [
      'Attestations',
      'BlockchainParameters',
      'Election',
      'Escrow',
      'Exchange',
      'GasCurrencyWhitelist',
      'GasPriceMinimum',
      'Governance',
      'LockedGold',
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
