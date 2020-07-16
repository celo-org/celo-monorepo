import { TOptions } from 'i18next'
import { ErrorDisplayType } from 'src/alert/reducer'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ALERT_BANNER_DURATION } from 'src/config'
import i18n, { Namespaces } from 'src/i18n'

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
  displayMethod: ErrorDisplayType
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

export const showError = (
  error: ErrorMessages,
  dismissAfter?: number | null,
  i18nOptions?: object
): ShowAlertAction => {
  ValoraAnalytics.track(AppEvents.error_displayed, { error })
  return showAlert(
    AlertTypes.ERROR,
    i18n.t(error, { ns: 'global', ...(i18nOptions || {}) }),
    dismissAfter,
    null,
    null,
    error
  )
}

export const showErrorInline = (error: ErrorMessages, i18nOptions?: TOptions): ShowAlertAction => ({
  type: Actions.SHOW,
  alertType: AlertTypes.ERROR,
  displayMethod: ErrorDisplayType.INLINE,
  message: i18n.t(error, { ns: Namespaces.global, ...(i18nOptions || {}) }),
  underlyingError: error,
})

// Useful for showing a more specific error if its a documented one, with
// a fallback to something more generic
export function showErrorOrFallback(error: any, fallback: ErrorMessages) {
  if (error && Object.values(ErrorMessages).includes(error.message)) {
    return showError(error.message)
  }

  ValoraAnalytics.track(AppEvents.error_fallback, {
    error: fallback,
  })

  return showError(fallback)
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
    displayMethod: ErrorDisplayType.BANNER,
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
