import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

const numeral = require('numeral')
require('numeral/locales/es')

export enum Actions {
  SET_INVITE_CODE_ENTERED = 'APP/SET_INVITE_CODE_ENTERED',
  SET_LOGGED_IN = 'APP/SET_LOGGED_IN',
  SET_NUMBER_VERIFIED = 'APP/SET_NUMBER_VERIFIED',
  SET_LANGUAGE = 'APP/SET_LANGUAGE',
  RESET_APP_OPENED_STATE = 'APP/RESET_APP_OPENED_STATE',
  ENTER_BACKUP_FLOW = 'APP/ENTER_BACKUP_FLOW',
  EXIT_BACKUP_FLOW = 'APP/EXIT_BACKUP_FLOW',
  SET_FEED_CACHE = 'APP/SET_FEED_CACHE',
  SET_ANALYTICS_ENABLED = 'APP/SET_ANALYTICS_ENABLED',
}

interface SetInviteCodeEntered {
  type: Actions.SET_INVITE_CODE_ENTERED
  inviteCodeEntered: boolean
}

interface SetLoggedIn {
  type: Actions.SET_LOGGED_IN
  loggedIn: boolean
}

interface SetNumberVerifiedAction {
  type: Actions.SET_NUMBER_VERIFIED
  numberVerified: boolean
}

interface SetLanguage {
  type: Actions.SET_LANGUAGE
  language: string
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

export type ActionTypes =
  | SetInviteCodeEntered
  | SetLoggedIn
  | SetNumberVerifiedAction
  | ResetAppOpenedState
  | SetLanguage
  | EnterBackupFlow
  | ExitBackupFlow
  | SetAnalyticsEnabled

export const setInviteCodeEntered = (inviteCodeEntered: boolean) => ({
  type: Actions.SET_INVITE_CODE_ENTERED,
  inviteCodeEntered,
})

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
  i18n.changeLanguage(language)

  if (nextScreen) {
    navigate(nextScreen)
  }
  return {
    type: Actions.SET_LANGUAGE,
    language,
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
