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
  Random = 'Random',
  Registry = 'Registry',
  Reserve = 'Reserve',
  SortedOracles = 'SortedOracles',
  StableToken = 'StableToken',
  Validators = 'Validators',
}

export type CeloToken = CeloContract.GoldToken | CeloContract.StableToken

export const AllContracts = Object.keys(CeloContract).map(
  (k) => (CeloContract as any)[k as any]
) as CeloContract[]

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000' as Address
