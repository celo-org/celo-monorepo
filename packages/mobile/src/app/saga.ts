import { AppState, Linking } from 'react-native'
import { REHYDRATE } from 'redux-persist/es/constants'
import { eventChannel } from 'redux-saga'
import { all, call, cancelled, put, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { getPincode } from 'src/account/saga'
import { showError } from 'src/alert/actions'
import {
  Actions,
  NavigatePinProtected,
  OpenDeepLink,
  SetAppState,
  setAppState,
  setLanguage,
} from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getAppLocked, getLockWithPinEnabled } from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { isAppVersionDeprecated } from 'src/firebase/firebase'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import {
  NavActions,
  navigate,
  navigateAfterPinEntered,
  navigateBack,
} from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
import { getCachedPincode } from 'src/pincode/PincodeCache'
import { PersistedRootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { clockInSync } from 'src/utils/time'
import { toggleFornoMode } from 'src/web3/actions'
import { isInitiallyFornoMode } from 'src/web3/contracts'
import { fornoSelector } from 'src/web3/selectors'
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

// Upon every app restart, web3 is initialized according to .env file
// This updates to the chosen forno mode in store
export function* toggleToProperSyncMode() {
  Logger.info(TAG + '@toggleToProperSyncMode/', 'Ensuring proper sync mode...')
  yield take(REHYDRATE)
  const fornoMode = yield select(fornoSelector)
  if (fornoMode !== isInitiallyFornoMode()) {
    Logger.info(TAG + '@toggleToProperSyncMode/', `Switching to fornoMode: ${fornoMode}`)
    yield put(toggleFornoMode(fornoMode))
  }
}

export function* navigateToProperScreen() {
  yield all([take(REHYDRATE), take(NavActions.SET_NAVIGATOR)])

  const isDeprecated: boolean = yield call(isAppVersionDeprecated)

  if (isDeprecated) {
    Logger.warn(TAG, 'App version is deprecated')
    navigate(Screens.UpgradeScreen)
    return
  } else {
    Logger.debug(TAG, 'App version is valid')
  }

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

  const deepLink = yield call(Linking.getInitialURL)
  const inSync = yield call(clockInSync)
  const lockWithPinEnabled = yield select(getLockWithPinEnabled)

  if (language) {
    yield put(setLanguage(language))
  }

  if (deepLink) {
    handleDeepLink(deepLink)
    return
  }

  const appLockedAwareNavigate = account && lockWithPinEnabled ? navigateAfterPinEntered : navigate

  if (!language) {
    appLockedAwareNavigate(Stacks.NuxStack)
  } else if (!inSync) {
    appLockedAwareNavigate(Screens.SetClock)
  } else if (!e164Number) {
    appLockedAwareNavigate(Screens.JoinCelo)
  } else if (pincodeType === PincodeType.Unset) {
    appLockedAwareNavigate(Screens.PincodeEducation)
  } else if (!redeemComplete && !account) {
    appLockedAwareNavigate(Screens.EnterInviteCode)
  } else if (!hasSeenVerificationNux) {
    appLockedAwareNavigate(Screens.VerificationEducationScreen)
  } else {
    appLockedAwareNavigate(Stacks.AppStack)
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

export function* handleNavigatePinProtected(action: NavigatePinProtected) {
  const fornoMode = yield select(fornoSelector)
  try {
    // TODO: Implement PIN protection for forno mode
    if (!fornoMode) {
      yield call(getPincode, false, () => {
        navigate(action.routeName, action.params)
      })
    } else {
      navigate(action.routeName, action.params)
    }
  } catch (error) {
    Logger.error(TAG + '@showBackupAndRecovery', 'Incorrect pincode', error)
    yield put(showError(ErrorMessages.INCORRECT_PIN))
  }
}

export function* watchNavigatePinProtected() {
  yield takeLatest(Actions.NAVIGATE_PIN_PROTECTED, handleNavigatePinProtected)
}

export function* watchDeepLinks() {
  yield takeLatest(Actions.OPEN_DEEP_LINK, handleDeepLink)
}

function createAppStateChannel() {
  return eventChannel((emit: any) => {
    AppState.addEventListener('change', emit)

    const removeEventListener = () => {
      AppState.removeEventListener('change', emit)
    }
    return removeEventListener
  })
}

function* watchAppState() {
  Logger.debug(`${TAG}@monitorAppState`, 'Starting monitor app state saga')
  const appStateChannel = yield createAppStateChannel()
  while (true) {
    try {
      const newState = yield take(appStateChannel)
      Logger.debug(`${TAG}@monitorAppState`, `App changed state: ${newState}`)
      yield put(setAppState(newState))
    } catch (error) {
      Logger.error(`${TAG}@monitorAppState`, `App state Error`, error)
    } finally {
      if (yield cancelled()) {
        appStateChannel.close()
      }
    }
  }
}

function* handleSetAppState(action: SetAppState) {
  const appLocked = yield select(getAppLocked)
  const cachedPin = getCachedPincode()
  const lockWithPinEnabled = yield select(getLockWithPinEnabled)
  if (lockWithPinEnabled && action.state === 'background' && !appLocked && !cachedPin) {
    navigate(Screens.Background, {
      onUnlock() {
        navigateBack({ immediate: true })
      },
    })
  }
}

export function* appSaga() {
  yield spawn(navigateToProperScreen)
  yield spawn(toggleToProperSyncMode)
  yield spawn(watchNavigatePinProtected)
  yield spawn(watchDeepLinks)
  yield spawn(watchAppState)
  yield takeLatest(Actions.SET_APP_STATE, handleSetAppState)
}
