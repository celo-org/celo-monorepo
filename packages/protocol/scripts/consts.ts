import path from 'path'
import { MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from '../contractPackages'

export const ROOT_DIR = path.join(__dirname, '../')
export const CONTRACTS_PACKAGE_SRC_DIR = path.join(__dirname, '../contracts')
export const ABIS_PACKAGE_SRC_DIR = path.join(__dirname, '../abis')
export const ABIS_BUILD_DIR = path.join(ABIS_PACKAGE_SRC_DIR, 'src-generated')
export const BUILD_EXECUTABLE = path.join(__dirname, 'build.ts')
export const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.json')

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
  'FeeCurrencyWhitelistProxy',
  'GoldTokenProxy',
  'GovernanceApproverMultiSigProxy',
  'GovernanceProxy',
  'LockedGoldProxy',
  'MetaTransactionWalletProxy',
  'MetaTransactionWalletDeployerProxy',
  'OdisPaymentsProxy',
  'RegistryProxy',
  'SortedOraclesProxy',
  'UniswapFeeHandlerSellerProxy',
]

export const CoreContracts = [
  // common
  'Accounts',
  'GasPriceMinimum',
  'FeeHandler',
  'MentoFeeHandlerSeller',
  'UniswapFeeHandlerSeller',
  'FeeCurrencyWhitelist',
  'GoldToken',
  'MetaTransactionWallet',
  'MetaTransactionWalletDeployer',
  'MultiSig',
  'Registry',
  'Freezer',
  'MetaTransactionWallet',

  // governance
  'Election',
  'EpochRewards',
  'Governance',
  'GovernanceApproverMultiSig',
  'BlockchainParameters',
  'DoubleSigningSlasher',
  'DowntimeSlasher',
  'LockedGold',
  'Validators',
  'ReleaseGold',

  // identity
  'Attestations',
  'Escrow',
  'FederatedAttestations',
  'Random',
  'OdisPayments',

  // stability
  'SortedOracles',
]

export const OtherContracts = [
  'Proxy',
  'Migrations',
  // abstract
  'Initializable',
  'UsingRegistry',
]

export const contractPackages = [MENTO_PACKAGE, SOLIDITY_08_PACKAGE].filter(Boolean)

export const Interfaces = ['ICeloToken', 'IERC20', 'ICeloVersionedContract']

export const ImplContracts = OtherContracts.concat(ProxyContracts).concat(CoreContracts)
