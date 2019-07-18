import { InitializationState } from 'src/geth/reducer'

export enum Actions {
  SET_INIT_STATE = 'GETH/SET_INIT_STATE',
  SET_GETH_CONNECTED = 'GETH/SET_GETH_CONNECTED',
}

interface SetInitState {
  type: Actions.SET_INIT_STATE
  state: InitializationState
}

export const setInitState = (state: InitializationState): SetInitState => ({
  type: Actions.SET_INIT_STATE,
  state,
})

interface SetGethConnected {
  type: Actions.SET_GETH_CONNECTED
  connected: boolean
}

export const setGethConnected = (connected: boolean): SetGethConnected => ({
  type: Actions.SET_GETH_CONNECTED,
  connected,
})

export type ActionTypes = SetInitState | SetGethConnected
