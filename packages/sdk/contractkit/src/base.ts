export enum CeloContract {
  Accounts = 'Accounts',
  Attestations = 'Attestations',
  BlockchainParameters = 'BlockchainParameters',
  DoubleSigningSlasher = 'DoubleSigningSlasher',
  DowntimeSlasher = 'DowntimeSlasher',
  Election = 'Election',
  EpochRewards = 'EpochRewards',
  ERC20 = 'ERC20',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  ExchangeEUR = 'ExchangeEUR',
  ExchangeBRL = 'ExchangeBRL',
  FeeCurrencyWhitelist = 'FeeCurrencyWhitelist',
  Freezer = 'Freezer',
  GasPriceMinimum = 'GasPriceMinimum',
  GoldToken = 'GoldToken',
  Governance = 'Governance',
  GrandaMento = 'GrandaMento',
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
  StableTokenBRL = 'StableTokenBRL',
  TransferWhitelist = 'TransferWhitelist',
  Validators = 'Validators',
}

export type StableTokenContract =
  | CeloContract.StableToken
  | CeloContract.StableTokenEUR
  | CeloContract.StableTokenBRL

export type ExchangeContract =
  | CeloContract.Exchange
  | CeloContract.ExchangeEUR
  | CeloContract.ExchangeBRL

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
  CeloContract.ERC20,
]
export const RegisteredContracts = AllContracts.filter((v) => !AuxiliaryContracts.includes(v))

/** @internal */
export const stripProxy = (contract: CeloContract) => contract.replace('Proxy', '') as CeloContract

/** @internal */
export const suffixProxy = (contract: CeloContract) =>
  contract.endsWith('Proxy') ? contract : (`${contract}Proxy` as CeloContract)

export const ProxyContracts = AllContracts.map((c) => suffixProxy(c))
