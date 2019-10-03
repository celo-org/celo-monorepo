import * as RNLocalize from 'react-native-localize'
import { LOCAL_CURRENCY_CODES, LocalCurrencyCode } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'

const MIN_UPDATE_INTERVAL = 12 * 3600 * 1000 // 12 hours

// Returns the best currency possible (it respects the user preferred currencies list order).
function findBestAvailableCurrency(supportedCurrencyCodes: LocalCurrencyCode[]) {
  const deviceCurrencies = RNLocalize.getCurrencies()
  const supportedCurrenciesSet = new Set(supportedCurrencyCodes)

  for (const deviceCurrency of deviceCurrencies) {
    if (supportedCurrenciesSet.has(deviceCurrency as LocalCurrencyCode)) {
      return deviceCurrency as LocalCurrencyCode
    }
  }

  return null
}

// TODO(jean): listen to locale changes so this stays accurate when changed while the app is running
const DEVICE_BEST_CURRENCY_CODE = findBestAvailableCurrency(LOCAL_CURRENCY_CODES)

export function getLocalCurrencyCode(state: RootState): LocalCurrencyCode | null {
  const currencyCode = state.localCurrency.preferredCurrencyCode || DEVICE_BEST_CURRENCY_CODE
  if (!currencyCode || currencyCode === LocalCurrencyCode.USD) {
    // This disables local currency display
    return null
  }

  return currencyCode
}

export function getLocalCurrencyExchangeRate(state: RootState) {
  const { exchangeRate, fetchedCurrencyCode } = state.localCurrency

  const localCurrencyCode = getLocalCurrencyCode(state)
  if (localCurrencyCode !== fetchedCurrencyCode) {
    // This makes sure we don't return stale exchange rate when the currency code changed
    return null
  }

  return exchangeRate
}

export function shouldFetchCurrentRate(state: RootState): boolean {
  const { isLoading, lastSuccessfulUpdate } = state.localCurrency

  if (isLoading) {
    return false
  }

  if (!getLocalCurrencyCode(state)) {
    return false
  }

  return !lastSuccessfulUpdate || Date.now() - lastSuccessfulUpdate > MIN_UPDATE_INTERVAL
}
