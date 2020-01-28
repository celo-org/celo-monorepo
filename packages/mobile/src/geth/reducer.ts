import { Actions, ActionTypes } from 'src/geth/actions'

export enum InitializationState {
  NOT_YET_INITIALIZED = 'NOT_YET_INITIALIZED',
  INITIALIZING = 'INITIALIZING',
  INITIALIZED = 'INITIALIZED',
  INITIALIZE_ERROR = 'INITIALIZE_ERROR',
  DATA_CONNECTION_MISSING_ERROR = 'DATA_CONNECTION_MISSING_ERROR',
}

export interface State {
  initialized: InitializationState
  connected: boolean
  promptFornoIfNeeded: boolean
}

const initialState: State = {
  initialized: InitializationState.NOT_YET_INITIALIZED,
  connected: false,
  promptFornoIfNeeded: false,
}

export function gethReducer(state: State = initialState, action: ActionTypes) {
  switch (action.type) {
    case Actions.SET_INIT_STATE:
      return { ...state, initialized: action.state }
    case Actions.SET_GETH_CONNECTED:
      return {
        ...state,
        connected: action.connected,
      }
    case Actions.SET_PROMPT_FORNO:
      return {
        ...state,
        promptFornoIfNeeded: action.promptIfNeeded,
      }
    default:
      return state
  }
}
