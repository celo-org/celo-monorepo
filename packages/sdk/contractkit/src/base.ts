export enum CeloContract {
  Accounts = 'Accounts',
  Attestations = 'Attestations',
  BlockchainParameters = 'BlockchainParameters',
  DoubleSigningSlasher = 'DoubleSigningSlasher',
  DowntimeSlasher = 'DowntimeSlasher',
  Election = 'Election',
  EpochRewards = 'EpochRewards',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  ExchangeEUR = 'ExchangeEUR',
  FeeCurrencyWhitelist = 'FeeCurrencyWhitelist',
  Freezer = 'Freezer',
  GasPriceMinimum = 'GasPriceMinimum',
  GoldToken = 'GoldToken',
  Governance = 'Governance',
  LockedGold = 'LockedGold',
  MetaTransactionWallet = 'MetaTransactionWallet',
  MetaTransactionWalletDeployer = 'MetaTransactionWalletDeployer',
  MultiSig = 'MultiSig',
  Random = 'Random',
  Registry = 'Registry',
  Reserve = 'Reserve',
  SortedOracles = 'SortedOracles',
  StableToken = 'StableToken',
  StableTokenEUR = 'StableTokenEUR',
  TransferWhitelist = 'TransferWhitelist',
  Validators = 'Validators',
}

export const ProxyContracts = Object.keys(CeloContract).map((c) => `${c}Proxy`)

export type StableTokenContract = CeloContract.StableToken | CeloContract.StableTokenEUR

export type ExchangeContract = CeloContract.Exchange | CeloContract.ExchangeEUR

export type CeloTokenContract = StableTokenContract | CeloContract.GoldToken
/**
 * Deprecated alias for CeloTokenContract.
 * @deprecated Use CeloTokenContract instead
 */
export type CeloToken = CeloTokenContract

export const AllContracts = Object.keys(CeloContract) as CeloContract[]
const AuxiliaryContracts = [
  CeloContract.MultiSig,
  CeloContract.MetaTransactionWalletDeployer,
  CeloContract.MetaTransactionWallet,
]
export const RegisteredContracts = AllContracts.filter((v) => !AuxiliaryContracts.includes(v))
