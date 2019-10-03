import { Actions, ActionTypes } from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

export interface State {
  isLoading: boolean
  preferredCurrencyCode?: LocalCurrencyCode
  exchangeRate?: number | null
  lastSuccessfulUpdate?: number
  fetchedCurrencyCode?: LocalCurrencyCode
}

const initialState = {
  isLoading: false,
}

export const reducer = (
  state: State = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      const persistedState = getRehydratePayload(action, 'localCurrency')

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
        fetchedCurrencyCode: action.currencyCode,
      }
    case Actions.FETCH_CURRENT_RATE_FAILURE:
      return {
        ...state,
        isLoading: false,
      }
    case Actions.SELECT_PREFERRED_CURRENCY:
      return {
        ...state,
        preferredCurrencyCode: action.currencyCode,
      }
    default:
      return state
  }
}
