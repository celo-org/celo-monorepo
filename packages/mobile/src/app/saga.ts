import { AppState, Linking } from 'react-native'
import { REHYDRATE } from 'redux-persist/es/constants'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { AnalyticsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  Actions,
  appLock,
  OpenDeepLink,
  SetAppState,
  setAppState,
  setLanguage,
} from 'src/app/actions'
import { currentLanguageSelector } from 'src/app/reducers'
import { getLastTimeBackgrounded, getRequirePinOnAppOpen } from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { isAppVersionDeprecated } from 'src/firebase/firebase'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
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
  const rehydrated = yield select((state: RootState) => state.networkInfo.rehydrated)
  if (rehydrated) {
    return
  }
  yield take(REHYDRATE)
  return
}

export function* watchRehydrate() {
  yield take(REHYDRATE)

  const isDeprecated: boolean = yield call(isAppVersionDeprecated)

  if (isDeprecated) {
    Logger.warn(TAG, 'App version is deprecated')
    navigate(Screens.UpgradeScreen)
    return
  } else {
    Logger.debug(TAG, 'App version is valid')
  }

  const language = yield select(currentLanguageSelector)
  if (language) {
    yield put(setLanguage(language))
  }

  const deepLink = yield call(Linking.getInitialURL)
  const inSync = yield call(clockInSync)
  if (!inSync) {
    navigate(Screens.SetClock)
    return
  }

  if (deepLink) {
    handleDeepLink(deepLink)
    return
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
      ValoraAnalytics.track(AnalyticsEvents.app_state_error, { error: error.message })
      Logger.error(`${TAG}@monitorAppState`, `App state Error`, error)
    } finally {
      if (yield cancelled()) {
        appStateChannel.close()
      }
    }
  }
}

export function* handleSetAppState(action: SetAppState) {
  const requirePinOnAppOpen = yield select(getRequirePinOnAppOpen)
  const lastTimeBackgrounded = yield select(getLastTimeBackgrounded)
  const isPassedDoNotLockPeriod = Date.now() - lastTimeBackgrounded > DO_NOT_LOCK_PERIOD
  const isAppActive = action.state === 'active'

  if (requirePinOnAppOpen && isPassedDoNotLockPeriod && isAppActive) {
    yield put(appLock())
  }
}

export function* appSaga() {
  yield spawn(watchRehydrate)
  yield spawn(watchDeepLinks)
  yield spawn(watchAppState)
  yield takeLatest(Actions.SET_APP_STATE, handleSetAppState)
}
