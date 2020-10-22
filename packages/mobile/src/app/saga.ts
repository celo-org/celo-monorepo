import { AppState, Linking } from 'react-native'
import { eventChannel } from 'redux-saga'
import {
  call,
  cancelled,
  put,
  select,
  spawn,
  take,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  Actions,
  appLock,
  minAppVersionDetermined,
  OpenDeepLink,
  openDeepLink,
  OpenUrlAction,
  SetAppState,
  setAppState,
  setLanguage,
} from 'src/app/actions'
import { currentLanguageSelector } from 'src/app/reducers'
import { getLastTimeBackgrounded, getRequirePinOnAppOpen } from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { appVersionDeprecationChannel } from 'src/firebase/firebase'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { handlePaymentDeeplink } from 'src/send/utils'
import { navigateToURI } from 'src/utils/linking'
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

// Work that's done before other sagas are initalized
// Be mindful to not put long blocking tasks here
export function* appInit() {
  const language = yield select(currentLanguageSelector)
  if (language) {
    yield put(setLanguage(language))
  }

  const deepLink: string | null = yield call(Linking.getInitialURL)
  const inSync = yield call(clockInSync)
  if (!inSync) {
    navigate(Screens.SetClock)
    return
  }

  if (deepLink) {
    // TODO: this should dispatch (put) but since this appInit
    // is called before the listener is set, we do it this way.
    // This is fragile, change me :D
    yield call(handleDeepLink, openDeepLink(deepLink))
    return
  }
}

export function* appVersionSaga() {
  const appVersionChannel = yield call(appVersionDeprecationChannel)
  if (!appVersionChannel) {
    return
  }
  try {
    while (true) {
      const minRequiredVersion = yield take(appVersionChannel)
      Logger.info(TAG, `Required min version: ${minRequiredVersion}`)
      // Note: The NavigatorWrapper will read this value from the store and
      // show the UpdateScreen if necessary.
      yield put(minAppVersionDetermined(minRequiredVersion))
    }
  } catch (error) {
    Logger.error(`${TAG}@appVersionSaga`, error)
  } finally {
    if (yield cancelled()) {
      appVersionChannel.close()
    }
  }
}

export function* handleDeepLink(action: OpenDeepLink) {
  const { deepLink } = action
  Logger.debug(TAG, 'Handling deep link', deepLink)
  const rawParams = parse(deepLink)
  if (rawParams.path) {
    if (rawParams.path.startsWith('/v/')) {
      yield put(receiveAttestationMessage(rawParams.path.substr(3), CodeInputType.DEEP_LINK))
    } else if (rawParams.path.startsWith('/pay')) {
      yield call(handlePaymentDeeplink, deepLink)
    } else if (rawParams.path.startsWith('/dappkit')) {
      handleDappkitDeepLink(deepLink)
    }
  }
}

export function* watchDeepLinks() {
  yield takeLatest(Actions.OPEN_DEEP_LINK, handleDeepLink)
}

export function* handleOpenUrl(action: OpenUrlAction) {
  const { url } = action
  Logger.debug(TAG, 'Handling url', url)
  yield call(navigateToURI, url)
}

export function* watchOpenUrl() {
  yield takeEvery(Actions.OPEN_URL, handleOpenUrl)
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
      ValoraAnalytics.track(AppEvents.app_state_error, { error: error.message })
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
  yield spawn(watchDeepLinks)
  yield spawn(watchOpenUrl)
  yield spawn(watchAppState)
  yield takeLatest(Actions.SET_APP_STATE, handleSetAppState)
}
