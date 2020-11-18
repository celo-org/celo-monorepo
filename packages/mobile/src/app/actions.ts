import i18n from 'src/i18n'
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
  SET_SESSION_ID = 'SET_SESSION_ID',
  OPEN_URL = 'APP/OPEN_URL',
  MIN_APP_VERSION_DETERMINED = 'APP/MIN_APP_VERSION_DETERMINED',
  SET_PONTO_FEATURE_FLAG = 'APP/SET_PONTO_FEATURE_FLAG',
  SET_KOTANI_FEATURE_FLAG = 'APP/SET_KOTANI_FEATURE_FLAG',
  TOGGLE_INVITE_MODAL = 'APP/TOGGLE_INVITE_MODAL',
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

interface SetRequirePinOnAppOpen {
  type: Actions.SET_LOCK_WITH_PIN_ENABLED
  enabled: boolean
}

interface InviteModalAction {
  type: Actions.TOGGLE_INVITE_MODAL
  inviteModalVisible: boolean
}

export interface Lock {
  type: Actions.LOCK
}

export interface Unlock {
  type: Actions.UNLOCK
}

export interface SetSessionId {
  type: Actions.SET_SESSION_ID
  sessionId: string
}

export interface OpenUrlAction {
  type: Actions.OPEN_URL
  url: string
}

interface MinAppVersionDeterminedAction {
  type: Actions.MIN_APP_VERSION_DETERMINED
  minVersion: string | null
}

interface PontoFeatureFlagSetAction {
  type: Actions.SET_PONTO_FEATURE_FLAG
  enabled: boolean
}

interface KotaniFeatureFlagSetAction {
  type: Actions.SET_KOTANI_FEATURE_FLAG
  enabled: boolean
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
  | SetRequirePinOnAppOpen
  | Lock
  | Unlock
  | SetSessionId
  | OpenUrlAction
  | MinAppVersionDeterminedAction
  | PontoFeatureFlagSetAction
  | KotaniFeatureFlagSetAction
  | InviteModalAction

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

export const setLanguage = (language: string) => {
  i18n
    .changeLanguage(language)
    .catch((reason: any) => Logger.error(TAG, 'Failed to change i18n language', reason))

  return {
    type: Actions.SET_LANGUAGE,
    language,
  }
}

export const openDeepLink = (deepLink: string): OpenDeepLink => {
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

export const setRequirePinOnAppOpen = (enabled: boolean): SetRequirePinOnAppOpen => ({
  type: Actions.SET_LOCK_WITH_PIN_ENABLED,
  enabled,
})

export const appLock = (): Lock => ({
  type: Actions.LOCK,
})

export const appUnlock = (): Unlock => ({
  type: Actions.UNLOCK,
})

export const setSessionId = (sessionId: string) => ({
  type: Actions.SET_SESSION_ID,
  sessionId,
})

export const openUrl = (url: string): OpenUrlAction => ({
  type: Actions.OPEN_URL,
  url,
})

export const minAppVersionDetermined = (
  minVersion: string | null
): MinAppVersionDeterminedAction => ({
  type: Actions.MIN_APP_VERSION_DETERMINED,
  minVersion,
})

export const setPontoFeatureFlag = (enabled: boolean) => ({
  type: Actions.SET_PONTO_FEATURE_FLAG,
  enabled,
})

export const setKotaniFeatureFlag = (enabled: boolean) => ({
  type: Actions.SET_KOTANI_FEATURE_FLAG,
  enabled,
})

export const toggleInviteModal = (inviteModalVisible: boolean): InviteModalAction => ({
  type: Actions.TOGGLE_INVITE_MODAL,
  inviteModalVisible,
})
