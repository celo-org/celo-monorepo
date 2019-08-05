export const attestationsRegistryId: string = 'Attestations'
export const bondedDepositsRegistryId: string = 'BondedDeposits'
export const exchangeRegistryId: string = 'Exchange'
export const gasCurrencyWhitelistRegistryId: string = 'GasCurrencyWhitelist'
export const gasPriceMinimumRegistryId: string = 'GasPriceMinimum'
export const goldTokenRegistryId: string = 'GoldToken'
export const governanceRegistryId: string = 'Governance'
export const randomRegistryId = 'Random'
export const reserveRegistryId: string = 'Reserve'
export const sortedOraclesRegistryId: string = 'SortedOracles'
export const validatorsRegistryId: string = 'Validators'
export const escrowRegistryId: string = 'Escrow'
export const stableTokenRegistryId: string = 'StableToken'

// TODO(amy): Pull this list from the build artifacts instead
export const usesRegistry = [escrowRegistryId, reserveRegistryId, stableTokenRegistryId]

// TODO(amy): Find another way to create this list
export const hasEntryInRegistry: string[] = [
  attestationsRegistryId,
  exchangeRegistryId,
  goldTokenRegistryId,
  gasCurrencyWhitelistRegistryId,
  gasPriceMinimumRegistryId,
  sortedOraclesRegistryId,
  stableTokenRegistryId,
  randomRegistryId,
  reserveRegistryId,
]

export default {
  attestationsRegistryId,
  exchangeRegistryId,
  goldTokenRegistryId,
  stableTokenRegistryId,
  sortedOraclesRegistryId,
  randomRegistryId,
  reserveRegistryId,
  gasPriceMinimumRegistryId,
}
