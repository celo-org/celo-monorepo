import { Actions, ActionTypes, AlertTypes, ShowAlertAction } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ALERT_BANNER_DURATION } from 'src/config'
import {
  Actions as ExchangeActions,
  ActionTypes as ExchangeActionTypes,
} from 'src/exchange/actions'
import i18n from 'src/i18n'
import { RootState } from 'src/redux/reducers'

export enum ErrorDisplayType {
  'BANNER',
  'INLINE',
}

export type State = {
  type: 'message' | 'error'
  displayMethod: ErrorDisplayType
  message: string
  dismissAfter?: number | null
  buttonMessage?: string | null
  action?: object | null
  title?: string | null
  underlyingError?: ErrorMessages | null
} | null

const initialState = null

const errorAction = (error: ErrorMessages): ShowAlertAction => ({
  type: Actions.SHOW,
  alertType: AlertTypes.ERROR,
  displayMethod: ErrorDisplayType.BANNER,
  message: i18n.t(error, { ns: 'global' }),
  dismissAfter: ALERT_BANNER_DURATION,
  buttonMessage: null,
  title: null,
  underlyingError: error,
})

export const reducer = (
  state: State = initialState,
  action: ActionTypes | ExchangeActionTypes
): State => {
  switch (action.type) {
    case ExchangeActions.WITHDRAW_CELO_FAILED:
      action = errorAction(action.error)
    case Actions.SHOW:
      return {
        displayMethod: action.displayMethod,
        type: action.alertType,
        message: action.message,
        dismissAfter: action.dismissAfter,
        buttonMessage: action.buttonMessage,
        action: action.action,
        title: action.title,
        underlyingError: action.underlyingError,
      }
    case Actions.HIDE:
      return null
    default:
      if (state?.action === action) {
        // Hide alert when the alert action is dispatched
        return null
      }
      return state
  }
}

export const errorSelector = (state: RootState) => {
  return state.alert ? state.alert.underlyingError || null : null
}
