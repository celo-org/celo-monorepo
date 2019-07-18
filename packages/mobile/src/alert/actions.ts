import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import i18n from 'src/i18n'

export enum Actions {
  SHOW = 'ALERT/SHOW',
  HIDE = 'ALERT/HIDE',
}

enum AlertTypes {
  MESSAGE = 'message',
  ERROR = 'error',
}

interface ShowAlertAction {
  type: Actions.SHOW
  alertType: AlertTypes
  message: string
  dismissAfter?: number | null
  buttonMessage?: string | null
  title?: string | null
  underlyingError?: ErrorMessages | null
}

interface HideAlertAction {
  type: Actions.HIDE
}

export type ActionTypes = ShowAlertAction | HideAlertAction

export const showMessage = (
  message: string,
  dismissAfter: number | null = null,
  buttonMessage?: string | null,
  title?: string | null
): ShowAlertAction => {
  return showAlert(AlertTypes.MESSAGE, message, dismissAfter, buttonMessage, title)
}

export const showError = (
  error: ErrorMessages,
  dismissAfter: number | null = null
): ShowAlertAction => {
  CeloAnalytics.track(DefaultEventNames.errorDisplayed, { error })
  return showAlert(
    AlertTypes.ERROR,
    i18n.t(error, { ns: 'global' }),
    dismissAfter,
    null,
    null,
    error
  )
}

const showAlert = (
  alertType: AlertTypes,
  message: string,
  dismissAfter: number | null,
  buttonMessage?: string | null,
  title?: string | null,
  underlyingError?: ErrorMessages | null
): ShowAlertAction => {
  return {
    type: Actions.SHOW,
    alertType,
    message,
    dismissAfter,
    buttonMessage,
    title,
    underlyingError,
  }
}

export const hideAlert = () => ({
  type: Actions.HIDE,
})
