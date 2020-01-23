import { InitializationState } from 'src/geth/reducer'
import { RootState } from 'src/redux/reducers'

export const isGethConnectedSelector = (state: RootState) =>
  state.geth.initialized === InitializationState.INITIALIZED && state.geth.connected
export const switchToZeroSyncPromptedSelector = (state: RootState) =>
  state.geth.switchToZeroSyncPrompted
