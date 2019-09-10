import { RootState } from 'src/redux/reducers'

export function getLocalCurrencyExchangeRate(state: RootState) {
  return state.localCurrency.exchangeRate
}
