export type Address = string

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
  TransferWhitelist = 'TransferWhitelist',
  Validators = 'Validators',
}

export const ProxyContracts = Object.keys(CeloContract).map((c) => `${c}Proxy`)

export type CeloToken = CeloContract.GoldToken | CeloContract.StableToken

export const AllContracts = Object.keys(CeloContract) as CeloContract[]
const AuxiliaryContracts = [CeloContract.MultiSig, CeloContract.MetaTransactionWalletDeployer]
export const RegisteredContracts = AllContracts.filter((v) => !AuxiliaryContracts.includes(v))

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000' as Address
