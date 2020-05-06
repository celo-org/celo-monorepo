export const WEI_PER_CELO = 1000000000000000000.0
export const UNLOCK_DURATION = 600

export enum GethSyncMode {
  // Valid sync mode values can be seen at https://github.com/celo-org/celo-blockchain/blob/3caca596d1ff23a9faf5339f108c993f38bfa743/mobile/geth.go#L43-L51
  // Anything invalid will cause Geth to panic and app to crash.
  Light = 3,
  // Value of 4 corresponds to a deprecated sync mode.
  Lightest = 5,
}

// Re-export from utils for convinience since we use these often
export {
  CURRENCIES,
  currencyToShortMap,
  CURRENCY_ENUM,
  resolveCurrency,
  SHORT_CURRENCIES,
} from '@celo/utils/src/currencies'
