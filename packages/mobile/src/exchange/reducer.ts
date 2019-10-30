import { Actions, ActionTypes } from 'src/exchange/actions'
import { RootState } from 'src/redux/reducers'

export interface ExchangeRatePair {
  goldMaker: string // number of dollarTokens received for one goldToken
  dollarMaker: string // number of goldTokens received for one dollarToken
}

export interface State {
  exchangeRatePair: ExchangeRatePair | null
}

const initialState = {
  exchangeRatePair: null,
}

export const exchangeRatePairSelector = (state: RootState) => state.exchange.exchangeRatePair

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_EXCHANGE_RATE:
      return {
        ...state,
        exchangeRatePair: action.exchangeRatePair,
      }
    default:
      return state
  }
}
