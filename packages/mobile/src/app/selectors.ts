import { isBalanceSufficientForSigRetrieval } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import { e164NumberSelector } from 'src/account/selectors'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { e164NumberToSaltSelector } from 'src/identity/reducer'
import { RootState } from 'src/redux/reducers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

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

export const verificationPossibleSelector = (state: RootState) => {
  const e164Number = e164NumberSelector(state)
  const dollarBalance = stableTokenBalanceSelector(state) || 0
  const celoBalance = celoTokenBalanceSelector(state) || 0
  const saltCache = e164NumberToSaltSelector(state)
  return !!(
    (e164Number && saltCache[e164Number]) ||
    isBalanceSufficientForSigRetrieval(dollarBalance, celoBalance)
  )
}
