import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ALERT_BANNER_DURATION } from 'src/config'
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

export const showMessage = (
  message: string,
  dismissAfter?: number | null,
  buttonMessage?: string | null,
  title?: string | null
): ShowAlertAction => {
  return showAlert(AlertTypes.MESSAGE, message, dismissAfter, buttonMessage, title)
}

export const showError = (error: ErrorMessages, dismissAfter?: number): ShowAlertAction => {
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
  dismissAfter: number | null = ALERT_BANNER_DURATION,
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

interface HideAlertAction {
  type: Actions.HIDE
}

export const hideAlert = (): HideAlertAction => ({
  type: Actions.HIDE,
})

export type ActionTypes = ShowAlertAction | HideAlertAction
