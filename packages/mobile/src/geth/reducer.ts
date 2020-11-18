import { Actions, ActionTypes, ChainHead } from 'src/geth/actions'

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
  chainHead: ChainHead | null
  gethStartedThisSession: boolean
}

const initialState: State = {
  initialized: InitializationState.NOT_YET_INITIALIZED,
  connected: false,
  gethStartedThisSession: false,
  chainHead: null,
}

export function gethReducer(state: State = initialState, action: ActionTypes) {
  switch (action.type) {
    case Actions.SET_INIT_STATE:
      return {
        ...state,
        initialized: action.state,
        gethStartedThisSession:
          action.state === InitializationState.INITIALIZED ? true : state.gethStartedThisSession, // Once geth initialized, it has been started this session
      }
    case Actions.SET_GETH_CONNECTED:
      return {
        ...state,
        connected: action.connected,
      }
    case Actions.SET_CHAIN_HEAD:
      return {
        ...state,
        chainHead: action.head,
      }
    default:
      return state
  }
}
