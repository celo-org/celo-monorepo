import { InitializationState } from 'src/geth/reducer'

export enum Actions {
  SET_INIT_STATE = 'GETH/SET_INIT_STATE',
  SET_GETH_CONNECTED = 'GETH/SET_GETH_CONNECTED',
  CANCEL_GETH_SAGA = 'GETH/CANCEL_GETH_SAGA',
  SET_ZERO_SYNC_PROMPTED = 'GETH/SET_ZERO_SYNC_PROMPTED',
}

interface SetInitState {
  type: Actions.SET_INIT_STATE
  state: InitializationState
}

export const setInitState = (state: InitializationState): SetInitState => ({
  type: Actions.SET_INIT_STATE,
  state,
})

export const cancelGethSaga = () => ({
  type: Actions.CANCEL_GETH_SAGA,
})

interface SetZeroSyncPrompted {
  type: Actions.SET_ZERO_SYNC_PROMPTED
}

export const setZeroSyncPrompted = () => ({
  type: Actions.SET_ZERO_SYNC_PROMPTED,
})

interface SetGethConnected {
  type: Actions.SET_GETH_CONNECTED
  connected: boolean
}

export const setGethConnected = (connected: boolean): SetGethConnected => ({
  type: Actions.SET_GETH_CONNECTED,
  connected,
})

export type ActionTypes = SetInitState | SetGethConnected | SetZeroSyncPrompted
