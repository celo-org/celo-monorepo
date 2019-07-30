import { Actions, ActionTypes } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { RootState } from 'src/redux/reducers'

export interface State {
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
      const { type, alertType, ...other } = action
      return {
        type: alertType,
        ...other,
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
