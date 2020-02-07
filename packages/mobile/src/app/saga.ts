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
  navigatePinProtected,
  OpenDeepLink,
  setLanguage,
} from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getLockWithPinEnabled } from 'src/app/selectors'
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
import { toggleFornoMode } from 'src/web3/actions'
import { isInitiallyFornoMode, web3 } from 'src/web3/contracts'
import { getAccount } from 'src/web3/saga'
import { currentAccountSelector, fornoSelector } from 'src/web3/selectors'
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

  const deepLink = yield call(Linking.getInitialURL)
  const inSync = yield call(clockInSync)
  const mappedState: PersistedStateProps = yield select(mapStateToProps)
  const lockWithPinEnabled = yield select(getLockWithPinEnabled)

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
    if (lockWithPinEnabled) {
      yield put(navigatePinProtected(Screens.VerificationEducationScreen, {}, true))
    } else {
      navigate(Screens.VerificationEducationScreen)
    }
  } else {
    if (lockWithPinEnabled) {
      yield put(navigatePinProtected(Stacks.AppStack, {}, true))
    } else {
      navigate(Stacks.AppStack)
    }
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

export function* navigateWithPinProtection(action: NavigatePinProtected) {
  const fornoMode = yield select(fornoSelector)
  try {
    if (!fornoMode) {
      const account = yield call(getAccount)
      yield call(
        getPincode,
        false,
        (password: string) => {
          return web3.eth.personal.unlockAccount(account, password, UNLOCK_DURATION)
        },
        action.hideBackButton,
        false
      )
      navigate(action.routeName, action.params)
    } else {
      // TODO: Implement PIN protection for forno mode
      navigate(action.routeName, action.params)
    }
  } catch (error) {
    Logger.error(TAG + '@showBackupAndRecovery', 'Incorrect pincode', error)
    yield put(showError(ErrorMessages.INCORRECT_PIN))
  }
}

export function* watchNavigatePinProtected() {
  yield takeLatest(Actions.NAVIGATE_PIN_PROTECTED, navigateWithPinProtection)
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
      if (newState === 'active') {
        const account = yield select(currentAccountSelector)
        const lockWithPinEnabled = yield select(getLockWithPinEnabled)
        if (account && lockWithPinEnabled) {
          console.debug(account)
          yield getPincode(
            false,
            (password: string) => {
              return web3.eth.personal.unlockAccount(account, password, UNLOCK_DURATION)
            },
            true,
            true
          )
        }
      }
    } catch (error) {
      Logger.error(`${TAG}@monitorAppState`, error)
    } finally {
      if (yield cancelled()) {
        appStateChannel.close()
      }
    }
  }
}

export function* appSaga() {
  yield spawn(navigateToProperScreen)
  yield spawn(toggleToProperSyncMode)
  yield spawn(checkAppDeprecation)
  yield spawn(watchNavigatePinProtected)
  yield spawn(watchDeepLinks)
  yield spawn(watchAppState)
}
