import { RootState } from 'src/redux/reducers'

const MIN_UPDATE_INTERVAL = 12 * 3600 * 1000 // 12 hours

export function getLocalCurrencyExchangeRate(state: RootState) {
  return state.localCurrency.exchangeRate
}

export function shouldFetchCurrentRate(state: RootState): boolean {
  const { isLoading, lastSuccessfulUpdate } = state.localCurrency

  if (isLoading) {
    return false
  }

  return !lastSuccessfulUpdate || Date.now() - lastSuccessfulUpdate > MIN_UPDATE_INTERVAL
}
