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
  promptZeroSyncIfNeeded: boolean
}

const initialState: State = {
  initialized: InitializationState.NOT_YET_INITIALIZED,
  connected: false,
  promptZeroSyncIfNeeded: false,
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
    case Actions.SET_PROMPT_ZERO_SYNC:
      return {
        ...state,
        promptZeroSyncIfNeeded: action.promptIfNeeded,
      }

    default:
      return state
  }
}
