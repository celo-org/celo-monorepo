import { Actions, ActionTypes } from 'src/app/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  loggedIn: boolean
  numberVerified: boolean
  language: string | null
  doingBackupFlow: boolean
  doingPinVerification: boolean
  analyticsEnabled: boolean
  figureEightUserId: string | null
  figureEightEarned: number | null
}

const initialState = {
  loading: false,
  loggedIn: false,
  numberVerified: false,
  language: null,
  doingBackupFlow: false,
  doingPinVerification: false,
  analyticsEnabled: true,
  figureEightUserId: null,
  figureEightEarned: null,
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
        doingPinVerification: false,
      }
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
    case Actions.SET_FIGURE_EIGHT_ACCOUNT:
      return {
        ...state,
        figureEightUserId: action.userId,
      }
    case Actions.SET_FIGURE_EIGHT_EARNED:
      return {
        ...state,
        figureEightEarned: action.amount,
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
    case Actions.START_PIN_VERIFICATION:
      return {
        ...state,
        doingPinVerification: true,
      }
    case Actions.FINISH_PIN_VERIFICATION:
      return {
        ...state,
        doingPinVerification: false,
      }
    default:
      return state
  }
}

export const figureEightUserIdSelector = (state: RootState) => state.app.figureEightUserId
export const figureEightEarnedSelector = (state: RootState) => state.app.figureEightEarned
