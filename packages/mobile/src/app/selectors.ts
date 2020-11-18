import { e164NumberSelector } from 'src/account/selectors'
import {
  e164NumberToSaltSelector,
  isBalanceSufficientForSigRetrievalSelector,
  tryFeelessOnboardingSelector,
} from 'src/identity/reducer'
import { RootState } from 'src/redux/reducers'

export const getRequirePinOnAppOpen = (state: RootState) => {
  return state.app.requirePinOnAppOpen
}

export const getAppState = (state: RootState) => {
  return state.app.appState
}

export const getAppLocked = (state: RootState) => {
  return state.app.locked
}

export const getLastTimeBackgrounded = (state: RootState) => {
  return state.app.lastTimeBackgrounded
}

export const sessionIdSelector = (state: RootState) => {
  return state.app.sessionId
}

export const verificationPossibleSelector = (state: RootState): boolean => {
  const e164Number = e164NumberSelector(state)
  const saltCache = e164NumberToSaltSelector(state)

  if (tryFeelessOnboardingSelector(state)) {
    return true
  }

  return !!(
    (e164Number && saltCache[e164Number]) ||
    isBalanceSufficientForSigRetrievalSelector(state)
  )
}

export const numberVerifiedSelector = (state: RootState) => state.app.numberVerified

export const pontoEnabledSelector = (state: RootState) => state.app.pontoEnabled

export const kotaniEnabledSelector = (state: RootState) => state.app.kotaniEnabled
