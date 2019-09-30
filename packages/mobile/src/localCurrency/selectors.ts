// import { lookup } from 'country-data'
// import { defaultCountryCodeSelector } from 'src/account/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'

const MIN_UPDATE_INTERVAL = 12 * 3600 * 1000 // 12 hours

export function getLocalCurrencyCode(state: RootState): LocalCurrencyCode | null {
  let currencyCode = state.localCurrency.preferredCurrencyCode
  if (!currencyCode) {
    // Determine currency from country code
    // const countryCallingCode = defaultCountryCodeSelector(state)
    // if (countryCallingCode) {
    //   lookup.countries({ countryCallingCode })
    // }
    return null
  }

  if (currencyCode === 'USD') {
    // Disable local currency if USD is selected
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
