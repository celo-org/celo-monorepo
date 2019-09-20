export type Address = string

export enum CeloContract {
  Attestations = 'Attestations',
  LockedGold = 'LockedGold',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  GasCurrencyWhitelist = 'GasCurrencyWhitelist',
  GasPriceMinimum = 'GasPriceMinimum',
  GoldToken = 'GoldToken',
  Governance = 'Governance',
  MultiSig = 'MultiSig',
  Random = 'Random',
  Registry = 'Registry',
  Reserve = 'Reserve',
  SortedOracles = 'SortedOracles',
  StableToken = 'StableToken',
  Validators = 'Validators',
}

export type CeloToken = CeloContract.GoldToken | CeloContract.StableToken

export const AllContracts = Object.keys(CeloContract).map(
  (k) => CeloContract[k as any]
) as CeloContract[]

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

export enum Roles {
  Validating = '0',
  Voting = '1',
  Rewards = '2',
}
