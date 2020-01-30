import { Linking } from 'react-native'
import { REHYDRATE } from 'redux-persist/es/constants'
import { all, call, put, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { getPincode } from 'src/account/saga'
import { showError } from 'src/alert/actions'
import {
  Actions,
  finishPinVerification,
  NavigatePinProtected,
  OpenDeepLink,
  setLanguage,
  startPinVerification,
} from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { isAppVersionDeprecated } from 'src/firebase/firebase'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { NavActions, navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
import { PersistedRootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { clockInSync } from 'src/utils/time'
import { toggleZeroSyncMode } from 'src/web3/actions'
import { isInitiallyZeroSyncMode, web3 } from 'src/web3/contracts'
import { getAccount } from 'src/web3/saga'
import { zeroSyncSelector } from 'src/web3/selectors'
import { parse } from 'url'

const TAG = 'app/saga'

export function* waitForRehydrate() {
  yield take(REHYDRATE)
  return
}

interface PersistedStateProps {
  language: string | null
  e164Number: string
  pincodeType: PincodeType
  redeemComplete: boolean
  account: string | null
  hasSeenVerificationNux: boolean
}

const mapStateToProps = (state: PersistedRootState): PersistedStateProps | null => {
  if (!state) {
    return null
  }
  return {
    language: state.app.language,
    e164Number: state.account.e164PhoneNumber,
    pincodeType: state.account.pincodeType,
    redeemComplete: state.invite.redeemComplete,
    account: state.web3.account,
    hasSeenVerificationNux: state.identity.hasSeenVerificationNux,
  }
}

export function* checkAppDeprecation() {
  yield call(waitForRehydrate)
  const isDeprecated: boolean = yield call(isAppVersionDeprecated)
  if (isDeprecated) {
    Logger.warn(TAG, 'App version is deprecated')
    navigate(Screens.UpgradeScreen)
  } else {
    Logger.debug(TAG, 'App version is valid')
  }
}

// Upon every app restart, web3 is initialized according to .env file
// This updates to the chosen zeroSync mode in store
export function* toggleToProperSyncMode() {
  Logger.info(TAG + '@toggleToProperSyncMode/', 'Ensuring proper sync mode...')
  yield take(REHYDRATE)
  const zeroSyncMode = yield select(zeroSyncSelector)
  if (zeroSyncMode !== isInitiallyZeroSyncMode()) {
    Logger.info(TAG + '@toggleToProperSyncMode/', `Switching to zeroSyncMode: ${zeroSyncMode}`)
    yield put(toggleZeroSyncMode(zeroSyncMode))
  }
}

export function* navigateToProperScreen() {
  yield all([take(REHYDRATE), take(NavActions.SET_NAVIGATOR)])

  const deepLink = yield call(Linking.getInitialURL)
  const inSync = yield call(clockInSync)
  const mappedState: PersistedStateProps = yield select(mapStateToProps)

  if (!mappedState) {
    navigate(Stacks.NuxStack)
    return
  }

  const {
    language,
    e164Number,
    pincodeType,
    redeemComplete,
    account,
    hasSeenVerificationNux,
  } = mappedState

  if (language) {
    yield put(setLanguage(language))
  }

  if (deepLink) {
    handleDeepLink(deepLink)
    return
  }

  if (!language) {
    navigate(Stacks.NuxStack)
  } else if (!inSync) {
    navigate(Screens.SetClock)
  } else if (!e164Number) {
    navigate(Screens.JoinCelo)
  } else if (pincodeType === PincodeType.Unset) {
    navigate(Screens.PincodeEducation)
  } else if (!redeemComplete && !account) {
    navigate(Screens.EnterInviteCode)
  } else if (!hasSeenVerificationNux) {
    navigate(Screens.VerificationEducationScreen)
  } else {
    navigate(Stacks.AppStack)
  }
}

export function* handleDeepLink(action: OpenDeepLink) {
  const { deepLink } = action
  Logger.debug(TAG, 'Handling deep link', deepLink)
  const rawParams = parse(deepLink, true)
  if (rawParams.path) {
    if (rawParams.path.startsWith('/v/')) {
      yield put(receiveAttestationMessage(rawParams.path.substr(3), CodeInputType.DEEP_LINK))
    }

    if (rawParams.path.startsWith('/dappkit')) {
      handleDappkitDeepLink(deepLink)
    }
  }
}

export function* navigatePinProtected(action: NavigatePinProtected) {
  const zeroSyncMode = yield select(zeroSyncSelector)
  try {
    if (!zeroSyncMode) {
      const pincode = yield call(getPincode, false)
      yield put(startPinVerification())
      const account = yield call(getAccount)
      yield call(web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
      navigate(action.routeName, action.params)
      yield put(finishPinVerification())
    } else {
      // TODO: Implement PIN protection for forno (zeroSyncMode)
      navigate(action.routeName, action.params)
    }
  } catch (error) {
    Logger.error(TAG + '@showBackupAndRecovery', 'Incorrect pincode', error)
    yield put(showError(ErrorMessages.INCORRECT_PIN))
    yield put(finishPinVerification())
  }
}

export function* watchNavigatePinProtected() {
  yield takeLatest(Actions.NAVIGATE_PIN_PROTECTED, navigatePinProtected)
}

export function* watchDeepLinks() {
  yield takeLatest(Actions.OPEN_DEEP_LINK, handleDeepLink)
}

export function* appSaga() {
  yield spawn(navigateToProperScreen)
  yield spawn(toggleToProperSyncMode)
  yield spawn(checkAppDeprecation)
  yield spawn(watchNavigatePinProtected)
  yield spawn(watchDeepLinks)
}
