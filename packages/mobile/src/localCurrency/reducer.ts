import { LOCAL_CURRENCY_SYMBOL } from 'src/config'
import { Actions, ActionTypes } from 'src/localCurrency/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

export interface State {
  isLoading: boolean
  symbol: string | null
  exchangeRate?: number | null
  lastSuccessfulUpdate?: number
}

const initialState = {
  isLoading: false,
  symbol: LOCAL_CURRENCY_SYMBOL,
}

export const reducer = (
  state: State = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      const persistedState = getRehydratePayload(action, 'localCurrency')

      // Make sure we don't use the persisted exchange rate if the symbol is now different
      if (persistedState && persistedState.symbol !== LOCAL_CURRENCY_SYMBOL) {
        // return a copy on purpose otherwise it's ignored
        return { ...initialState }
      }

      // Ignore some persisted properties
      return {
        ...state,
        ...persistedState,
        isLoading: false,
      }
    }
    case Actions.FETCH_CURRENT_RATE:
      return {
        ...state,
        isLoading: true,
      }
    case Actions.FETCH_CURRENT_RATE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        exchangeRate: action.exchangeRate,
        lastSuccessfulUpdate: action.now,
      }
    case Actions.FETCH_CURRENT_RATE_FAILURE:
      return {
        ...state,
        isLoading: false,
      }
    default:
      return state
  }
}
