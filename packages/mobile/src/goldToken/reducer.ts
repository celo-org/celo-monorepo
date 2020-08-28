import { Actions, ActionTypes } from 'src/goldToken/actions'

export interface State {
  balance: string | null
  lastFetch: number | null
  educationCompleted: boolean
  educationDismissed: boolean
}

export const initialState = {
  balance: null,
  lastFetch: null,
  educationCompleted: false,
  educationDismissed: false,
}

export function reducer(state: State | undefined = initialState, action: ActionTypes): State {
  switch (action.type) {
    case Actions.SET_BALANCE:
      return {
        ...state,
        balance: action.balance,
        lastFetch: Date.now(),
      }
    case Actions.SET_EDUCATION_COMPLETED:
      return {
        ...state,
        educationCompleted: action.educationCompleted,
      }
    case Actions.DISMISS_CELO_EDUCATION:
      return {
        ...state,
        educationDismissed: true,
      }
    default:
      return state
  }
}
