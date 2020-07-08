import { InitializationState } from 'src/geth/reducer'
import { RootState } from 'src/redux/reducers'

export const gethInitializedSelector = (state: RootState) => state.geth.initialized

export const isGethConnectedSelector = (state: RootState) =>
  state.geth.initialized === InitializationState.INITIALIZED && state.geth.connected

export const gethStartedThisSessionSelector = (state: RootState) =>
  state.geth.gethStartedThisSession
