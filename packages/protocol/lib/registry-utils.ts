export enum CeloContractName {
  Attestations = 'Attestations',
  BlockchainParameters = 'BlockchainParameters',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  GasCurrencyWhitelist = 'GasCurrencyWhitelist',
  GasPriceMinimum = 'GasPriceMinimum',
  GoldToken = 'GoldToken',
  Governance = 'Governance',
  LockedGold = 'LockedGold',
  Random = 'Random',
  Reserve = 'Reserve',
  SortedOracles = 'SortedOracles',
  StableToken = 'StableToken',
  Validators = 'Validators',
}

// TODO(amy): Pull this list from the build artifacts instead
export const usesRegistry = [
  CeloContractName.Escrow,
  CeloContractName.Reserve,
  CeloContractName.StableToken,
]

// TODO(amy): Find another way to create this list
export const hasEntryInRegistry: string[] = [
  CeloContractName.Attestations,
  CeloContractName.BlockchainParameters,
  CeloContractName.Escrow,
  CeloContractName.Exchange,
  CeloContractName.GasCurrencyWhitelist,
  CeloContractName.GasPriceMinimum,
  CeloContractName.GoldToken,
  CeloContractName.Random,
  CeloContractName.Reserve,
  CeloContractName.SortedOracles,
  CeloContractName.StableToken,
]
