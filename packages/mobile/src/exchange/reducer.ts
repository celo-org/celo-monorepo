import { Actions, ActionTypes } from 'src/exchange/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export const MAX_HISTORY_RETENTION = 30 * 24 * 3600 * 1000 // (ms) ~ 180 days

export interface ExchangeRatePair {
  goldMaker: string // number of dollarTokens received for one goldToken
  dollarMaker: string // number of goldTokens received for one dollarToken
}

export interface ExchangeRate {
  exchangeRate: string
  timestamp: number
}

export interface State {
  exchangeRatePair: ExchangeRatePair | null
  tobinTax: string | null
  history: {
    celoGoldExchangeRates: ExchangeRate[]
    lastTimeUpdated: number
  }
}

const initialState = {
  exchangeRatePair: null,
  tobinTax: null,
  history: {
    celoGoldExchangeRates: [],
    lastTimeUpdated: 0,
  },
}

export const exchangeRatePairSelector = (state: RootState) => state.exchange.exchangeRatePair
export const exchangeHistorySelector = (state: RootState) => state.exchange.history

export const historyReducer = (
  state: State['history'] | undefined = initialState.history,
  action: ActionTypes
): State['history'] => {
  const now = Date.now()
  switch (action.type) {
    case Actions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY:
      return {
        ...state,
        celoGoldExchangeRates: [...state.celoGoldExchangeRates, ...action.exchangeRates].filter(
          (er) => er.timestamp > now - MAX_HISTORY_RETENTION
        ),
        lastTimeUpdated: now,
      }
    default:
      return state
  }
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'exchange'),
        exchangeRatePair: initialState.exchangeRatePair,
      }
    }

    case Actions.SET_EXCHANGE_RATE:
      return {
        ...state,
        exchangeRatePair: action.exchangeRatePair,
      }
    case Actions.SET_TOBIN_TAX:
      return {
        ...state,
        tobinTax: action.tobinTax,
      }
    case Actions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY:
      return {
        ...state,
        history: historyReducer(state.history, action),
      }
    default:
      return state
  }
}
