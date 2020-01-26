import { RootState } from 'src/redux/reducers'
export function getExchangeRatePair(state: RootState) {
  return state.exchange.exchangeRatePair
}
