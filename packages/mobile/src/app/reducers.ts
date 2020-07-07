import { Platform } from 'react-native'
import { Actions, ActionTypes, AppState } from 'src/app/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  loggedIn: boolean
  numberVerified: boolean
  language: string | null
  doingBackupFlow: boolean
  analyticsEnabled: boolean
  requirePinOnAppOpen: boolean
  appState: AppState
  locked: boolean
  lastTimeBackgrounded: number
  sessionId: string
}

const initialState = {
  loading: false,
  loggedIn: false,
  numberVerified: false,
  language: null,
  doingBackupFlow: false,
  analyticsEnabled: true,
  requirePinOnAppOpen: false,
  appState: AppState.Active,
  locked: false,
  lastTimeBackgrounded: 0,
  sessionId: '',
}

export const currentLanguageSelector = (state: RootState) => state.app.language

export const appReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      const rehydratePayload = getRehydratePayload(action, 'app')
      return {
        ...state,
        ...rehydratePayload,
        appState: initialState.appState,
        locked: rehydratePayload.requirePinOnAppOpen ?? initialState.locked,
        sessionId: '',
      }
    }
    case Actions.SET_APP_STATE:
      let { appState, lastTimeBackgrounded } = state
      switch (action.state) {
        case 'background':
          if (Platform.OS === 'android') {
            lastTimeBackgrounded = Date.now()
          }
          appState = AppState.Background
          break
        case 'inactive': // occurs only on iOS
          lastTimeBackgrounded = Date.now()
          appState = AppState.Inactive
          break
        case 'active':
          appState = AppState.Active
          break
      }
      return {
        ...state,
        appState,
        lastTimeBackgrounded,
      }
    case Actions.SET_LOGGED_IN:
      return {
        ...state,
        loggedIn: action.loggedIn,
      }
    case Actions.SET_NUMBER_VERIFIED:
      return {
        ...state,
        numberVerified: action.numberVerified,
      }
    case Actions.SET_LANGUAGE:
      return {
        ...state,
        language: action.language,
      }
    case Actions.RESET_APP_OPENED_STATE:
      return {
        ...state,
        loggedIn: false,
        numberVerified: false,
        language: null,
      }
    case Actions.ENTER_BACKUP_FLOW:
      return {
        ...state,
        doingBackupFlow: true,
      }
    case Actions.EXIT_BACKUP_FLOW:
      return {
        ...state,
        doingBackupFlow: false,
      }
    case Actions.SET_ANALYTICS_ENABLED:
      return {
        ...state,
        analyticsEnabled: action.enabled,
      }
    case Actions.SET_LOCK_WITH_PIN_ENABLED:
      return {
        ...state,
        requirePinOnAppOpen: action.enabled,
      }
    case Actions.LOCK:
      return {
        ...state,
        locked: true,
      }
    case Actions.UNLOCK:
      return {
        ...state,
        locked: false,
      }
    case Actions.SET_SESSION_ID:
      return {
        ...state,
        sessionId: action.sessionId,
      }
    default:
      return state
  }
}
