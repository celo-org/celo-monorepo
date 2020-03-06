import { getRegionCode } from '@celo/utils/src/phoneNumbers'
import CountryData from 'country-data'
import { createSelector } from 'reselect'
import { e164NumberSelector } from 'src/account/selectors'
import {
  LOCAL_CURRENCY_CODES,
  LocalCurrencyCode,
  LocalCurrencySymbol,
} from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'

const MIN_UPDATE_INTERVAL = 12 * 3600 * 1000 // 12 hours

function getCountryCurrencies(e164PhoneNumber: string) {
  const regionCode = getRegionCode(e164PhoneNumber)
  const countries = CountryData.lookup.countries({ alpha2: regionCode })
  const country = countries.length > 0 ? countries[0] : undefined

  return country ? country.currencies : []
}

const getDefaultLocalCurrencyCode = createSelector(
  e164NumberSelector,
  (e164PhoneNumber): LocalCurrencyCode => {
    // Note: we initially tried using the device locale for getting the currencies (`RNLocalize.getCurrencies()`)
    // but the problem is some Android versions don't make it possible to select the appropriate language/country
    // from the device settings.
    // So here we use the country of the phone number
    const countryCurrencies = getCountryCurrencies(e164PhoneNumber)
    const supportedCurrenciesSet = new Set(LOCAL_CURRENCY_CODES)

    for (const countryCurrency of countryCurrencies) {
      if (supportedCurrenciesSet.has(countryCurrency as LocalCurrencyCode)) {
        return countryCurrency as LocalCurrencyCode
      }
    }

    return LocalCurrencyCode.USD
  }
)

export function getLocalCurrencyCode(state: RootState): LocalCurrencyCode {
  return state.localCurrency.preferredCurrencyCode || getDefaultLocalCurrencyCode(state)
}

export function getLocalCurrencySymbol(state: RootState): LocalCurrencySymbol | null {
  return LocalCurrencySymbol[getLocalCurrencyCode(state)]
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

  return !lastSuccessfulUpdate || Date.now() - lastSuccessfulUpdate > MIN_UPDATE_INTERVAL
}
