/* tslint:disable:no-console */

import { governanceRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  deployProxyAndImplementation,
  getDeployedProxiedContract,
  transferOwnershipOfProxy,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { GovernanceInstance, RegistryInstance, ReserveInstance } from 'types'

const initializeArgs = async (networkName: string): Promise<any[]> => {
  const approver = require('@celo/protocol/truffle.js').networks[networkName].from

  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )

  return [
    registry.address,
    approver,
    config.governance.concurrentProposals,
    web3.utils.toWei(config.governance.minDeposit.toString(), 'ether'),
    config.governance.queueExpiry,
    config.governance.dequeueFrequency,
    config.governance.approvalStageDuration,
    config.governance.referendumStageDuration,
    config.governance.executionStageDuration,
  ]
}

module.exports = deployProxyAndImplementation<GovernanceInstance>(
  web3,
  artifacts,
  'Governance',
  initializeArgs,
  async (governance: GovernanceInstance) => {
    const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
      'Registry',
      artifacts
    )
    await registry.setAddressFor(governanceRegistryId, governance.address)

    console.log('Setting Governance as a Reserve spender')
    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    await reserve.addSpender(governance.address)

    const proxyOwnedByGovernance = ['GoldToken', 'Random']
    for (const contractName of proxyOwnedByGovernance) {
      await transferOwnershipOfProxy(contractName, governance.address, artifacts)
    }

    const proxyAndImplementationOwnedByGovernance = [
      'Attestations',
      'BondedDeposits',
      'Escrow',
      'Exchange',
      'GasCurrencyWhitelist',
      'GasPriceMinimum',
      'Governance',
      'Quorum',
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
)
