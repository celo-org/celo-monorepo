/* tslint:disable:no-console */

import { constitution } from '@celo/protocol/governanceConstitution'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
  getFunctionSelectorsForContract,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { GovernanceApproverMultiSigInstance, GovernanceInstance } from 'types'
import { MENTO_PACKAGE } from '../contractPackages'
import { ArtifactsSingleton } from './artifactsSingleton'

const initializeArgs = async (networkName: string): Promise<any[]> => {
  const governanceApproverMultiSig: GovernanceApproverMultiSigInstance =
    await getDeployedProxiedContract<GovernanceApproverMultiSigInstance>(
      CeloContractName.GovernanceApproverMultiSig,
      artifacts
    )
  const networkFrom: string = require('@celo/protocol/truffle-config.js').networks[networkName].from
  const approver: string = config.governanceApproverMultiSig.useMultiSig
    ? governanceApproverMultiSig.address
    : networkFrom

  return [
    config.registry.predeployedProxyAddress,
    approver,
    config.governance.concurrentProposals,
    web3.utils.toWei(config.governance.minDeposit.toString(), 'ether'),
    config.governance.queueExpiry,
    config.governance.dequeueFrequency,
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
    if (!config.governance.skipSetConstitution) {
      console.info('Setting constitution thresholds')
      const constitutionContractNames = Object.keys(constitution).filter(
        (contractName) => contractName !== 'proxy'
      )

      for (const contractName of constitutionContractNames) {
        console.log(`\tSetting constitution thresholds for ${contractName}`)

        const artifactsObject = ArtifactsSingleton.getInstance(
          constitution[contractName].__contractPackage,
          artifacts
        )

        const contract = await getDeployedProxiedContract<Truffle.ContractInstance>(
          contractName,
          artifactsObject
        )
        const selectors = getFunctionSelectorsForContract(contract, contractName, artifactsObject)

        selectors.default = ['0x00000000']
        const thresholds = { ...constitution.proxy, ...constitution[contractName] }
        await Promise.all(
          Object.keys(thresholds)
            .filter((method) => method !== '__contractPackage')
            .map((func) =>
              Promise.all(
                selectors[func].map((selector) =>
                  governance.setConstitution(contract.address, selector, toFixed(thresholds[func]))
                )
              )
            )
        )
      }
    }

    const proxyAndImplementationOwnedByGovernance = [
      {
        contracts: [
          'Accounts',
          'Attestations',
          // BlockchainParameters ownership transitioned to governance in a follow-up script.
          // 'BlockchainParameters',
          'DoubleSigningSlasher',
          'DowntimeSlasher',
          'Election',
          'EpochRewards',
          'Escrow',
          // TODO add fee handler
          'FederatedAttestations',
          'FeeCurrencyWhitelist',
          'Freezer',
          'GasPriceMinimum',
          'GoldToken',
          'Governance',
          'GovernanceSlasher',
          'LockedGold',
          'OdisPayments',
          'Random',
          'Registry',
          'SortedOracles',
          'Validators',
        ],
      },
      {
        contracts: [
          'Exchange',
          'ExchangeEUR',
          'ExchangeBRL',
          'GrandaMento',
          'Reserve',
          'StableToken',
          'StableTokenEUR',
          'StableTokenBRL',
        ],
        __contractPackage: MENTO_PACKAGE, // TODO refactor this
      },
    ]

    if (!config.governance.skipTransferOwnership) {
      for (const contractPackage of proxyAndImplementationOwnedByGovernance) {
        const artifactsInstance = ArtifactsSingleton.getInstance(
          contractPackage.__contractPackage,
          artifacts
        )
        for (const contractName of contractPackage.contracts) {
          await transferOwnershipOfProxyAndImplementation(
            contractName,
            governance.address,
            artifactsInstance
          )
        }
      }
    }
  }
)
