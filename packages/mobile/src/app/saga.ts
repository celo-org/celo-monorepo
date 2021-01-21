import { CURRENCY_ENUM } from '@celo/utils/src'
import URLSearchParamsReal from '@ungap/url-search-params'
import { AppState } from 'react-native'
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
  setKotaniFeatureFlag,
  setLanguage,
  setPontoFeatureFlag,
} from 'src/app/actions'
import { currentLanguageSelector } from 'src/app/reducers'
import { getLastTimeBackgrounded, getRequirePinOnAppOpen } from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { appRemoteFeatureFlagChannel, appVersionDeprecationChannel } from 'src/firebase/firebase'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
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

  const inSync = yield call(clockInSync)
  if (!inSync) {
    navigate(Screens.SetClock)
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

interface RemoteFeatureFlags {
  kotaniEnabled: boolean
  pontoEnabled: boolean
}

export function* appRemoteFeatureFlagSaga() {
  const remoteFeatureFlagChannel = yield call(appRemoteFeatureFlagChannel)
  if (!remoteFeatureFlagChannel) {
    return
  }
  try {
    while (true) {
      const flags: RemoteFeatureFlags = yield take(remoteFeatureFlagChannel)
      Logger.info(
        TAG,
        `Updated flags to ponto: ${flags.pontoEnabled} and kotani: ${flags.kotaniEnabled}`
      )
      yield put(setPontoFeatureFlag(flags.pontoEnabled))
      yield put(setKotaniFeatureFlag(flags.kotaniEnabled))
    }
  } catch (error) {
    Logger.error(`${TAG}@appRemoteFeatureFlagSaga`, error)
  } finally {
    if (yield cancelled()) {
      remoteFeatureFlagChannel.close()
    }
  }
}

function parseValue(value: string) {
  if (['true', 'false'].indexOf(value) >= 0) {
    return value === 'true'
  }
  const number = parseFloat(value)
  if (!isNaN(number)) {
    return number
  }
  return value
}

// Parses the query string into an object. Only works with built-in strings, booleans and numbers.
function convertQueryToScreenParams(query: string) {
  const decodedParams = new URLSearchParamsReal(decodeURIComponent(query))
  const params: { [key: string]: any } = {}
  for (const [key, value] of decodedParams.entries()) {
    params[key] = parseValue(value)
  }
  return params
}

export function* handleDeepLink(action: OpenDeepLink) {
  const { deepLink, isSecureOrigin } = action
  Logger.debug(TAG, 'Handling deep link', deepLink)
  const rawParams = parse(deepLink)
  if (rawParams.path) {
    if (rawParams.path.startsWith('/v/')) {
      yield put(receiveAttestationMessage(rawParams.path.substr(3), CodeInputType.DEEP_LINK))
    } else if (rawParams.path.startsWith('/pay')) {
      yield call(handlePaymentDeeplink, deepLink)
    } else if (rawParams.path.startsWith('/dappkit')) {
      handleDappkitDeepLink(deepLink)
    } else if (rawParams.path === '/cashIn') {
      navigate(Screens.FiatExchangeOptions, { isCashIn: true })
    } else if (rawParams.pathname === '/bidali') {
      navigate(Screens.BidaliScreen, { currency: CURRENCY_ENUM.DOLLAR })
    } else if (isSecureOrigin && rawParams.pathname === '/openScreen' && rawParams.query) {
      // The isSecureOrigin is important. We don't want it to be possible to fire this deep link from outside
      // of our own notifications for security reasons.
      const params = convertQueryToScreenParams(rawParams.query)
      navigate(params.screen as keyof StackParamList, params)
    }
  }
}

export function* watchDeepLinks() {
  yield takeLatest(Actions.OPEN_DEEP_LINK, handleDeepLink)
}

export function* handleOpenUrl(action: OpenUrlAction) {
  const { url, openExternal, isSecureOrigin } = action
  Logger.debug(TAG, 'Handling url', url)
  if (url.startsWith('celo:')) {
    // Handle celo links directly, this avoids showing the "Open with App" sheet on Android
    yield call(handleDeepLink, openDeepLink(url, isSecureOrigin))
  } else if (/^https?:\/\//i.test(url) === true && !openExternal) {
    // We display http or https links using our in app browser, unless openExternal is forced
    navigate(Screens.WebViewScreen, { uri: url })
  } else {
    // Fallback
    yield call(navigateToURI, url)
  }
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
