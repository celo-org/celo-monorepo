import { Actions, ActionTypes } from 'src/app/actions'
import { RootState } from 'src/redux/reducers'

export interface State {
  inviteCodeEntered: boolean
  loggedIn: boolean
  numberVerified: boolean
  language: string | null
  doingBackupFlow: boolean
  analyticsEnabled: boolean
}

const initialState = {
  inviteCodeEntered: false,
  loading: false,
  loggedIn: false,
  numberVerified: false,
  language: null,
  doingBackupFlow: false,
  analyticsEnabled: true,
}

export const currentLanguageSelector = (state: RootState) => state.app.language

export const appReducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_INVITE_CODE_ENTERED:
      return {
        ...state,
        inviteCodeEntered: action.inviteCodeEntered,
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
        inviteCodeEntered: false,
        loggedIn: false,
        numberVerified: false,
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
    default:
      return state
  }
}
