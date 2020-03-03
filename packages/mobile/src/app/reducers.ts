import { Actions, ActionTypes, AppState } from 'src/app/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  loggedIn: boolean
  numberVerified: boolean
  language: string | null
  doingBackupFlow: boolean
  doingPinVerification: boolean
  analyticsEnabled: boolean
  lockWithPinEnabled: boolean
  appState: AppState
  locked: boolean
}

const initialState = {
  loading: false,
  loggedIn: false,
  numberVerified: false,
  language: null,
  doingBackupFlow: false,
  doingPinVerification: false,
  analyticsEnabled: true,
  lockWithPinEnabled: false,
  appState: AppState.Active,
  locked: false,
}

export const currentLanguageSelector = (state: RootState) => state.app.language

export const appReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'app'),
        doingPinVerification: initialState.doingPinVerification,
        appState: initialState.appState,
        locked: initialState.locked,
      }
    }
    case Actions.SET_APP_STATE:
      let appState = state.appState
      switch (action.state) {
        case 'background':
          appState = AppState.Background
          break
        case 'inactive':
          appState = AppState.Inactive
          break
        case 'active':
          appState = AppState.Active
          break
      }
      return {
        ...state,
        appState,
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
        lockWithPinEnabled: action.enabled,
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
    default:
      return state
  }
}
