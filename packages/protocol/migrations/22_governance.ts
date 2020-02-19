/* tslint:disable:no-console */

import { constitution } from '@celo/protocol/governanceConstitution'
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

    console.info('Setting constitution thresholds')
    Object.keys(constitution)
      .filter((contractName) => contractName !== 'proxy')
      .forEach(async (contractName) => {
        const proxy: any = artifacts.require(contractName + 'Proxy')
        const contract: any = await getDeployedProxiedContract<Truffle.ContractInstance>(
          contractName,
          artifacts
        )

        // Build mapping of function names to selectors
        // Each function name maps to an array of selectors to account for overloading
        const selectors: { [index: string]: string[] } = {}
        proxy.abi
          .concat(contract.abi)
          .filter((abiEntry: any) => abiEntry.type === 'function')
          .forEach((func: any) => {
            if (typeof selectors[func.name] === 'undefined') {
              selectors[func.name] = []
            }
            selectors[func.name].push(func.signature)
          })

        const setThresholds = (thresholds: any) => {
          Object.keys(thresholds)
            .filter((func) => func !== 'default')
            .forEach(async (func) => {
              await Promise.all(
                selectors[func].map((selector) =>
                  governance.setConstitution(
                    contract.address,
                    selector,
                    toFixed(thresholds[func]).toFixed()
                  )
                )
              )
            })
        }
        setThresholds(constitution.proxy)
        setThresholds(constitution[contractName])

        // set default threshold
        await governance.setConstitution(
          contract.address,
          '0x00000000',
          toFixed(constitution[contractName].default).toFixed()
        )
      })

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
