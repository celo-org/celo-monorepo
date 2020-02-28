import { RootState } from 'src/redux/reducers'
import { fornoSelector } from 'src/web3/selectors'

export const getLockWithPinEnabled = (state: RootState) => {
  // TODO remove `&& !fornoSelector`, when we can ensure PIN in forno mode
  return state.app.lockWithPinEnabled && !fornoSelector(state)
}

export const getAppState = (state: RootState) => {
  return state.app.appState
}

export const getAppLocked = (state: RootState) => {
  return state.app.locked
}
