import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

const TAG = 'app/actions'

// https://facebook.github.io/react-native/docs/appstate
export enum AppState {
  Background = 'Background',
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum Actions {
  SET_APP_STATE = 'APP/SET_APP_STATE',
  SET_LOGGED_IN = 'APP/SET_LOGGED_IN',
  SET_NUMBER_VERIFIED = 'APP/SET_NUMBER_VERIFIED',
  SET_LANGUAGE = 'APP/SET_LANGUAGE',
  OPEN_DEEP_LINK = 'APP/OPEN_DEEP_LINK',
  RESET_APP_OPENED_STATE = 'APP/RESET_APP_OPENED_STATE',
  ENTER_BACKUP_FLOW = 'APP/ENTER_BACKUP_FLOW',
  EXIT_BACKUP_FLOW = 'APP/EXIT_BACKUP_FLOW',
  SET_FEED_CACHE = 'APP/SET_FEED_CACHE',
  SET_ANALYTICS_ENABLED = 'APP/SET_ANALYTICS_ENABLED',
  SET_LOCK_WITH_PIN_ENABLED = 'APP/SET_LOCK_WITH_PIN_ENABLED',
  LOCK = 'APP/LOCK',
  UNLOCK = 'APP/UNLOCK',
}

export interface SetAppState {
  type: Actions.SET_APP_STATE
  state: string
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

interface SetLockWithPinEnabled {
  type: Actions.SET_LOCK_WITH_PIN_ENABLED
  enabled: boolean
}

export interface Lock {
  type: Actions.LOCK
}

export interface Unlock {
  type: Actions.UNLOCK
}

export type ActionTypes =
  | SetAppState
  | SetLoggedIn
  | SetNumberVerifiedAction
  | ResetAppOpenedState
  | SetLanguage
  | OpenDeepLink
  | EnterBackupFlow
  | ExitBackupFlow
  | SetAnalyticsEnabled
  | SetLockWithPinEnabled
  | Lock
  | Unlock

export const setAppState = (state: string) => ({
  type: Actions.SET_APP_STATE,
  state,
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

export const setLockWithPinEnabled = (enabled: boolean): SetLockWithPinEnabled => ({
  type: Actions.SET_LOCK_WITH_PIN_ENABLED,
  enabled,
})

export const appLock = (): Lock => ({
  type: Actions.LOCK,
})

export const appUnlock = (): Unlock => ({
  type: Actions.UNLOCK,
})
