import { InitializationState } from 'src/geth/reducer'
import { RootState } from 'src/redux/reducers'

export const isGethConnectedSelector = (state: RootState) =>
  state.geth.initialized === InitializationState.INITIALIZED && state.geth.connected
export const gethStartedThisSessionSelector = (state: RootState) =>
  state.geth.gethStartedThisSession
export const currentAccountSelector = (state: RootState) =>
  (state.geth.account && state.geth.account.toLowerCase()) || null
export const currentAccountInGethKeystoreSelector = (state: RootState) =>
  state.geth.accountInGethKeystore
export const privateCommentKeySelector = (state: RootState) => state.geth.commentKey
