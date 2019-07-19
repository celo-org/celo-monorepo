export const attestationsRegistryId: string = 'Attestations'
export const bondedDepositsRegistryId: string = 'BondedDeposits'
export const escrowRegistryId: string = 'Escrow'
export const exchangeRegistryId: string = 'Exchange'
export const gasCurrencyWhitelistRegistryId: string = 'GasCurrencyWhitelist'
export const gasPriceMinimumRegistryId: string = 'GasPriceMinimum'
export const goldTokenRegistryId: string = 'GoldToken'
export const governanceRegistryId: string = 'Governance'
export const randomRegistryId = 'Random'
export const reserveRegistryId: string = 'Reserve'
export const sortedOraclesRegistryId: string = 'SortedOracles'
export const stableTokenRegistryId: string = 'StableToken'
export const validatorsRegistryId: string = 'Validators'

// TODO(amy): Pull this list from the build artifacts instead
export const usesRegistry = [escrowRegistryId, reserveRegistryId, stableTokenRegistryId]

// TODO(amy): Find another way to create this list
export const hasEntryInRegistry: string[] = [
  attestationsRegistryId,
  escrowRegistryId,
  exchangeRegistryId,
  gasCurrencyWhitelistRegistryId,
  gasPriceMinimumRegistryId,
  goldTokenRegistryId,
  randomRegistryId,
  reserveRegistryId,
  sortedOraclesRegistryId,
  stableTokenRegistryId,
]

export default {
  attestationsRegistryId,
  escrowRegistryId,
  exchangeRegistryId,
  gasPriceMinimumRegistryId,
  goldTokenRegistryId,
  randomRegistryId,
  reserveRegistryId,
  sortedOraclesRegistryId,
  stableTokenRegistryId,
}
