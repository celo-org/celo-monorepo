import { constitution } from '@celo/protocol/governanceConstitution'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
  getFunctionSelectorsForContractProxy,
  transferOwnershipOfProxyAndImplementation,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { GovernanceApproverMultiSigInstance, GovernanceInstance } from 'types'
import { MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from '../contractPackages'

import { ArtifactsSingleton } from '../lib/artifactsSingleton'

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
        console.info(`\tSetting constitution thresholds for ${contractName}`)

        const artifactsObject = ArtifactsSingleton.getInstance(
          constitution[contractName].__contractPackage,
          artifacts
        )

        const contract = await getDeployedProxiedContract<Truffle.ContractInstance>(
          contractName,
          artifactsObject
        )

        const selectors = getFunctionSelectorsForContractProxy(
          contract,
          artifactsObject.getProxy(contractName, artifacts),
          web3
        )

        selectors.default = ['0x00000000']
        const thresholds = { ...constitution.proxy, ...constitution[contractName] }

        const tresholdKeys = Object.keys(thresholds).filter(
          (method) => method !== '__contractPackage'
        )

        for (const func of tresholdKeys) {
          await Promise.all(
            selectors[func].map((selector) =>
              governance.setConstitution(contract.address, selector, toFixed(thresholds[func]))
            )
          )
        }
      }
    }

    // This list probably needs a refactor
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
          'FederatedAttestations',
          'FeeCurrencyWhitelist',
          'Freezer',
          'FeeHandler',
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
        __contractPackage: MENTO_PACKAGE,
      },
      {
        contracts: ['GasPriceMinimum'],
        __contractPackage: SOLIDITY_08_PACKAGE,
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
