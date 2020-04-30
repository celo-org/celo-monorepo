import { AppState, Linking } from 'react-native'
import { REHYDRATE } from 'redux-persist/es/constants'
import { eventChannel } from 'redux-saga'
import { all, call, cancelled, put, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import {
  Actions,
  appLock,
  OpenDeepLink,
  SetAppState,
  setAppState,
  setLanguage,
} from 'src/app/actions'
import { getAppLocked, getLastTimeBackgrounded, getLockWithPinEnabled } from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { isAppVersionDeprecated } from 'src/firebase/firebase'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { NavActions, navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
import { getCachedPincode } from 'src/pincode/PincodeCache'
import { PersistedRootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { clockInSync } from 'src/utils/time'
import { parse } from 'url'

const TAG = 'app/saga'

// There are cases, when user will put the app into `background` state,
// but we do not want to lock it immeditely. Here are some examples:
// case 1: User switches to SMS app to copy verification text
// case 2: User gets a permission request dialog
//    (which will put an app into `background` state until dialog disappears).
const DO_NOT_LOCK_PERIOD = 30000 // 30 sec

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
  acceptedTerms: boolean
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
    acceptedTerms: state.account.acceptedTerms,
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
    acceptedTerms,
  } = mappedState

  const deepLink = yield call(Linking.getInitialURL)
  const inSync = yield call(clockInSync)

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
  } else if (!acceptedTerms) {
    navigate(Screens.RegulatoryTerms)
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

export function* handleSetAppState(action: SetAppState) {
  const appLocked = yield select(getAppLocked)
  const lastTimeBackgrounded = yield select(getLastTimeBackgrounded)
  const now = Date.now()
  const cachedPin = getCachedPincode()
  const lockWithPinEnabled = yield select(getLockWithPinEnabled)
  if (
    !cachedPin &&
    lockWithPinEnabled &&
    now - lastTimeBackgrounded > DO_NOT_LOCK_PERIOD &&
    action.state === 'active' &&
    !appLocked
  ) {
    yield put(appLock())
  }
}

export function* appSaga() {
  yield spawn(navigateToProperScreen)
  yield spawn(watchDeepLinks)
  yield spawn(watchAppState)
  yield takeLatest(Actions.SET_APP_STATE, handleSetAppState)
}
