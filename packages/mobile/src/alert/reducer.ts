import { Actions, ActionTypes } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { RootState } from 'src/redux/reducers'

export interface State {
  errorType: 'show' | 'log'
  type: 'message' | 'error'
  message: string
  dismissAfter?: number | null
  buttonMessage?: string | null
  title?: string | null
  underlyingError?: ErrorMessages | null
}

const initialState = null

export const reducer = (state: State | null = initialState, action: ActionTypes): State | null => {
  switch (action.type) {
    case Actions.SHOW:
      return {
        errorType: 'show',
        type: action.alertType,
        message: action.message,
        dismissAfter: action.dismissAfter,
        buttonMessage: action.buttonMessage,
        title: action.title,
        underlyingError: action.underlyingError,
      }
    case Actions.LOG:
      return {
        errorType: 'log',
        type: action.alertType,
        message: action.message,
        underlyingError: action.underlyingError,
      }
    case Actions.HIDE:
      return null
    default:
      return state
  }
}

export const errorSelector = (state: RootState) => {
  return state.alert ? state.alert.underlyingError || null : null
}
