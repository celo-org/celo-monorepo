export enum CeloContract {
  Attestations = 'Attestations',
  BondedDeposits = 'BondedDeposits',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  GasCurrencyWhitelist = 'GasCurrencyWhitelist',
  GasPriceMinimum = 'GasPriceMinimum',
  GoldToken = 'GoldToken',
  Governance = 'Governance',
  Random = 'Random',
  Reserve = 'Reserve',
  SortedOracles = 'SortedOracles',
  StableToken = 'StableToken',
  Validators = 'Validators',
}

// TODO(amy): Pull this list from the build artifacts instead
export const usesRegistry = [CeloContract.Escrow, CeloContract.Reserve, CeloContract.StableToken]

// TODO(amy): Find another way to create this list
export const hasEntryInRegistry: string[] = [
  CeloContract.Attestations,
  CeloContract.Escrow,
  CeloContract.Exchange,
  CeloContract.GoldToken,
  CeloContract.GasCurrencyWhitelist,
  CeloContract.GasPriceMinimum,
  CeloContract.SortedOracles,
  CeloContract.StableToken,
  CeloContract.Random,
  CeloContract.Reserve,
]
