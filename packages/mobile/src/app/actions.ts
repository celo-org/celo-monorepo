import { NavigationParams } from 'react-navigation'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
const numeral = require('numeral')
require('numeral/locales/es')

const TAG = 'app/actions'

export enum Actions {
  SET_LOGGED_IN = 'APP/SET_LOGGED_IN',
  SET_NUMBER_VERIFIED = 'APP/SET_NUMBER_VERIFIED',
  SET_LANGUAGE = 'APP/SET_LANGUAGE',
  OPEN_DEEP_LINK = 'APP/OPEN_DEEP_LINK',
  RESET_APP_OPENED_STATE = 'APP/RESET_APP_OPENED_STATE',
  ENTER_BACKUP_FLOW = 'APP/ENTER_BACKUP_FLOW',
  EXIT_BACKUP_FLOW = 'APP/EXIT_BACKUP_FLOW',
  SET_FEED_CACHE = 'APP/SET_FEED_CACHE',
  SET_ANALYTICS_ENABLED = 'APP/SET_ANALYTICS_ENABLED',
  NAVIGATE_PIN_PROTECTED = 'APP/NAVIGATE_PIN_PROTECTED',
  START_PIN_VERIFICATION = 'APP/START_PIN_VERIFICATION',
  FINISH_PIN_VERIFICATION = 'APP/FINISH_PIN_VERIFICATION',
}

interface SetLoggedIn {
  type: Actions.SET_LOGGED_IN
  loggedIn: boolean
}

interface SetNumberVerifiedAction {
  type: Actions.SET_NUMBER_VERIFIED
  numberVerified: boolean
}

export interface SetLanguage {
  type: Actions.SET_LANGUAGE
  language: string
}

export interface OpenDeepLink {
  type: Actions.OPEN_DEEP_LINK
  deepLink: string
}

interface ResetAppOpenedState {
  type: Actions.RESET_APP_OPENED_STATE
}

interface EnterBackupFlow {
  type: Actions.ENTER_BACKUP_FLOW
}

interface ExitBackupFlow {
  type: Actions.EXIT_BACKUP_FLOW
}

interface SetAnalyticsEnabled {
  type: Actions.SET_ANALYTICS_ENABLED
  enabled: boolean
}

export interface NavigatePinProtected {
  type: Actions.NAVIGATE_PIN_PROTECTED
  routeName: string
  params?: NavigationParams
}

interface StartPinVerification {
  type: Actions.START_PIN_VERIFICATION
}

interface FinishPinVerification {
  type: Actions.FINISH_PIN_VERIFICATION
}

export type ActionTypes =
  | SetLoggedIn
  | SetNumberVerifiedAction
  | ResetAppOpenedState
  | SetLanguage
  | OpenDeepLink
  | EnterBackupFlow
  | ExitBackupFlow
  | SetAnalyticsEnabled
  | NavigatePinProtected
  | StartPinVerification
  | FinishPinVerification

export const setLoggedIn = (loggedIn: boolean) => ({
  type: Actions.SET_LOGGED_IN,
  loggedIn,
})

export const setNumberVerified = (numberVerified: boolean) => ({
  type: Actions.SET_NUMBER_VERIFIED,
  numberVerified,
})

export const setLanguage = (language: string, nextScreen?: Screens) => {
  numeral.locale(language.substring(0, 2))
  i18n
    .changeLanguage(language)
    .catch((reason: any) => Logger.error(TAG, 'Failed to change i18n language', reason))

  if (nextScreen) {
    navigate(nextScreen)
  }
  return {
    type: Actions.SET_LANGUAGE,
    language,
  }
}

export const openDeepLink = (deepLink: string) => {
  return {
    type: Actions.OPEN_DEEP_LINK,
    deepLink,
  }
}

export const resetAppOpenedState = () => ({
  type: Actions.RESET_APP_OPENED_STATE,
})

export const enterBackupFlow = () => ({
  type: Actions.ENTER_BACKUP_FLOW,
})

export const exitBackupFlow = () => ({
  type: Actions.EXIT_BACKUP_FLOW,
})

export const setAnalyticsEnabled = (enabled: boolean): SetAnalyticsEnabled => ({
  type: Actions.SET_ANALYTICS_ENABLED,
  enabled,
})

export const navigatePinProtected = (
  routeName: string,
  params?: NavigationParams
): NavigatePinProtected => ({
  type: Actions.NAVIGATE_PIN_PROTECTED,
  routeName,
  params,
})

export const startPinVerification = (): StartPinVerification => ({
  type: Actions.START_PIN_VERIFICATION,
})

export const finishPinVerification = (): FinishPinVerification => ({
  type: Actions.FINISH_PIN_VERIFICATION,
})
