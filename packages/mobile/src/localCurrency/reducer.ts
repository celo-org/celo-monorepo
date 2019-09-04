import { Actions, ActionTypes } from 'src/localCurrency/actions'

export interface State {
  isLoading: boolean
  exchangeRate?: number | null
}

const initialState = {
  isLoading: false,
  exchangeRate: 1.33,
}

export const reducer = (state: State = initialState, action: ActionTypes): State => {
  switch (action.type) {
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
