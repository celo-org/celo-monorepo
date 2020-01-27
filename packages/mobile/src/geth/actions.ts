import { InitializationState } from 'src/geth/reducer'

export enum Actions {
  SET_INIT_STATE = 'GETH/SET_INIT_STATE',
  SET_GETH_CONNECTED = 'GETH/SET_GETH_CONNECTED',
  CANCEL_GETH_SAGA = 'GETH/CANCEL_GETH_SAGA',
  SET_PROMPT_FORNO = 'GETH/SET_PROMPT_FORNO',
}

interface SetInitStateAction {
  type: Actions.SET_INIT_STATE
  state: InitializationState
}

export const setInitState = (state: InitializationState): SetInitStateAction => ({
  type: Actions.SET_INIT_STATE,
  state,
})

export const cancelGethSaga = () => ({
  type: Actions.CANCEL_GETH_SAGA,
})

interface SetPromptFornoAction {
  type: Actions.SET_PROMPT_FORNO
  promptIfNeeded: boolean
}

export const setPromptForno = (promptIfNeeded: boolean): SetPromptFornoAction => ({
  type: Actions.SET_PROMPT_FORNO,
  promptIfNeeded,
})

interface SetGethConnectedAction {
  type: Actions.SET_GETH_CONNECTED
  connected: boolean
}

export const setGethConnected = (connected: boolean): SetGethConnectedAction => ({
  type: Actions.SET_GETH_CONNECTED,
  connected,
})

export type ActionTypes = SetInitStateAction | SetGethConnectedAction | SetPromptFornoAction
