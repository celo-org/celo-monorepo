export const attestationsRegistryId = 'Attestations'
export const bondedDepositsRegistryId: string = 'BondedDeposits'
export const exchangeRegistryId: string = 'Exchange'
export const gasCurrencyWhitelistRegistryId: string = 'GasCurrencyWhitelist'
export const gasPriceMinimumRegistryId: string = 'GasPriceMinimum'
export const goldTokenRegistryId: string = 'GoldToken'
export const governanceRegistryId: string = 'Governance'
export const quorumRegistryId = 'Quorum'
export const randomRegistryId = 'Random'
export const reserveRegistryId: string = 'Reserve'
export const sortedOraclesRegistryId: string = 'SortedOracles'
export const validatorsRegistryId: string = 'Validators'

// These do not actually appear in the registry, but they are here temporarily for usesRegistry
const escrowRegistryId = 'Escrow'
const stableTokenRegistryId = 'StableToken'

// TODO(amy): Pull this list from the build artifacts instead
export const usesRegistry = [escrowRegistryId, reserveRegistryId, stableTokenRegistryId]

// TODO(amy): Find another way to create this list
export const hasEntryInRegistry: string[] = [
  attestationsRegistryId,
  exchangeRegistryId,
  gasCurrencyWhitelistRegistryId,
  gasPriceMinimumRegistryId,
  goldTokenRegistryId,
  quorumRegistryId,
  randomRegistryId,
  reserveRegistryId,
  sortedOraclesRegistryId,
]

export default {
  attestationsRegistryId,
  exchangeRegistryId,
  gasPriceMinimumRegistryId,
  goldTokenRegistryId,
  randomRegistryId,
  reserveRegistryId,
  sortedOraclesRegistryId,
}
