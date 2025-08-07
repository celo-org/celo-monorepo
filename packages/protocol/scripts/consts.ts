import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import path from 'path'
import { MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from '../contractPackages'

export const ROOT_DIR = path.join(__dirname, '../')
export const CONTRACTS_PACKAGE_SRC_DIR = path.join(__dirname, '../contracts')
export const CONTRACTS_08_SOURCE_DIR = path.join(ROOT_DIR, 'contracts-0.8')
export const CONTRACTS_08_PACKAGE_DESTINATION_DIR = path.join(CONTRACTS_PACKAGE_SRC_DIR, '0.8')
export const ABIS_PACKAGE_SRC_DIR = path.join(__dirname, '../abis')
export const ABIS_BUILD_DIR = path.join(ABIS_PACKAGE_SRC_DIR, 'src-generated')
export const ABIS_DIST_DIR = path.join(ABIS_PACKAGE_SRC_DIR, 'dist')
export const DEVCHAIN_ANVIL_PACKAGE_SRC_DIR = path.join(__dirname, '../.tmp')
export const BUILD_EXECUTABLE = path.join(__dirname, 'build.ts')
export const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json')

const PROXY_CONTRACT = 'Proxy'

export const ProxyContracts = [
  'AccountsProxy',
  'AttestationsProxy',
  'BlockchainParametersProxy',
  'DoubleSigningSlasherProxy',
  'DowntimeSlasherProxy',
  'ElectionProxy',
  'EpochRewardsProxy',
  'EscrowProxy',
  'FederatedAttestationsProxy',
  'FeeHandlerProxy',
  'MentoFeeHandlerSellerProxy',
  'FeeCurrencyDirectoryProxy',
  'FeeCurrencyWhitelistProxy',
  'GoldTokenProxy',
  'GovernanceApproverMultiSigProxy',
  'GovernanceProxy',
  'GovernanceSlasherProxy',
  'LockedGoldProxy',
  'OdisPaymentsProxy',
  'RegistryProxy',
  'SortedOraclesProxy',
  'UniswapFeeHandlerSellerProxy',
  'CeloUnreleasedTreasuryProxy',
]

export const CoreContracts: string[] = [
  // common
  CeloContractName.Accounts,
  CeloContractName.GasPriceMinimum,
  CeloContractName.FeeHandler,
  CeloContractName.MentoFeeHandlerSeller,
  CeloContractName.UniswapFeeHandlerSeller,
  CeloContractName.FeeCurrencyDirectory,
  CeloContractName.FeeCurrencyWhitelist,
  CeloContractName.GoldToken,
  'MultiSig' as const,
  'Registry' as const,
  CeloContractName.Freezer,
  CeloContractName.CeloUnreleasedTreasury,

  // governance
  CeloContractName.Election,
  CeloContractName.EpochRewards,
  CeloContractName.EpochManager,
  CeloContractName.EpochManagerEnabler,
  CeloContractName.Governance,
  CeloContractName.GovernanceSlasher,
  CeloContractName.GovernanceApproverMultiSig,
  CeloContractName.BlockchainParameters,
  CeloContractName.DoubleSigningSlasher,
  CeloContractName.DowntimeSlasher,
  CeloContractName.LockedGold,
  CeloContractName.Validators,
  'ReleaseGold' as const,
  CeloContractName.ScoreManager,

  // identity
  CeloContractName.Attestations,
  CeloContractName.Escrow,
  CeloContractName.FederatedAttestations,
  CeloContractName.Random,
  CeloContractName.OdisPayments,

  // stability
  CeloContractName.SortedOracles,
]

export const OtherContracts = [
  PROXY_CONTRACT,
  'Migrations',
  // abstract
  'Initializable',
  'UsingRegistry',
]

export const contractPackages = [MENTO_PACKAGE, SOLIDITY_08_PACKAGE].filter(Boolean)

export const Interfaces = ['ICeloToken', 'IERC20', 'ICeloVersionedContract'] as const

export const ImplContracts = OtherContracts.concat(ProxyContracts).concat(CoreContracts)

export const PublishContracts = [
  ...CoreContracts,
  ...Interfaces,
  PROXY_CONTRACT,
  ...MENTO_PACKAGE.contracts,
]

export const AliasedContracts = {
  [CeloContractName.GoldToken]: CeloContractName.CeloToken,
  [CeloContractName.LockedGold]: CeloContractName.LockedCelo,
}

export enum BuildTarget {
  CJS = 'cjs',
  ESM = 'esm',
  TYPES = 'types',
}
