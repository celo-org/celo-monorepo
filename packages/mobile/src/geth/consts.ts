export const WEI_PER_JEM = 1000000000000000000.0
export const GAS_PER_TRANSACTION = 21001.0
export const GAS_PRICE_STALE_AFTER = 15000 // 1.5 seconds
export const GAS_PRICE_PLACEHOLDER = 18000000000
export const UNLOCK_DURATION = 600
// TODO(Rossy) remove this when we calculate the invite fees dynamically
export const INVITE_REDEMPTION_GAS = 100000000000000000

// Valid sync mode values can be seen at https://github.com/celo-org/celo-blockchain/blob/8be27f7c044e35dbf63a42500a79805f1bddcfb8/mobile/geth.go#L43-L47
// Anything invalid will cause Geth to panic and app to crash.
export const SYNC_MODE_LIGHT = 3
export const SYNC_MODE_CELOLATEST = 4
export const SYNC_MODE_ULTRALIGHT = 5

// Re-export from utils for convinience since we use these often
export {
  CURRENCIES,
  currencyToShortMap,
  CURRENCY_ENUM,
  resolveCurrency,
  SHORT_CURRENCIES,
} from '@celo/utils/src/currencies'
