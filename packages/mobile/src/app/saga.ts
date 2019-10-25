import { Linking } from 'react-native'
import { REHYDRATE } from 'redux-persist/es/constants'
import { all, call, put, select, spawn, take } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { setLanguage } from 'src/app/actions'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { getVersionInfo } from 'src/firebase/firebase'
import { waitForFirebaseAuth } from 'src/firebase/saga'
import { NavActions, navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
import { PersistedRootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { clockInSync } from 'src/utils/time'
import { setZeroSyncMode } from 'src/web3/actions'
import { isInitiallyZeroSyncMode } from 'src/web3/contracts'
import { zeroSyncSelector } from 'src/web3/selectors'

const TAG = 'app/saga'

export function* waitForRehydrate() {
  yield take(REHYDRATE)
  return
}

interface PersistedStateProps {
  language: string | null
  e164Number: string
  numberVerified: boolean
  pincodeType: PincodeType
  redeemComplete: boolean
  account: string | null
  startedVerification: boolean
  askedContactsPermission: boolean
}

const mapStateToProps = (state: PersistedRootState): PersistedStateProps | null => {
  if (!state) {
    return null
  }
  return {
    language: state.app.language,
    e164Number: state.account.e164PhoneNumber,
    numberVerified: state.app.numberVerified,
    pincodeType: state.account.pincodeType,
    redeemComplete: state.invite.redeemComplete,
    account: state.web3.account,
    startedVerification: state.identity.startedVerification,
    askedContactsPermission: state.identity.askedContactsPermission,
  }
}

export function* checkAppDeprecation() {
  yield call(waitForRehydrate)
  yield call(waitForFirebaseAuth)
  const versionInfo = yield getVersionInfo()
  Logger.info(TAG, 'Version Info', JSON.stringify(versionInfo))
  if (versionInfo && versionInfo.deprecated) {
    Logger.info(TAG, 'this version is deprecated')
    navigate(Screens.UpgradeScreen)
  }
}

// Upon every app restart, web3 is initialized according to .env file
// This updates to the chosen zeroSync mode in store
export function* toggleToProperSyncMode() {
  Logger.info(TAG, '@toggleToProperSyncMode ensuring proper sync mode...')
  yield take(REHYDRATE)
  const zeroSyncMode = yield select(zeroSyncSelector)
  if (zeroSyncMode !== isInitiallyZeroSyncMode()) {
    yield put(setZeroSyncMode(zeroSyncMode))
  }
}

export function* navigateToProperScreen() {
  yield all([take(REHYDRATE), take(NavActions.SET_NAVIGATOR)])

  const deepLink = yield call(Linking.getInitialURL)
  const inSync = yield call(clockInSync)
  const mappedState = yield select(mapStateToProps)

  if (!mappedState) {
    navigate(Stacks.NuxStack)
    return
  }

  const {
    language,
    e164Number,
    numberVerified,
    pincodeType,
    redeemComplete,
    account,
    startedVerification,
    askedContactsPermission,
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
  } else if (!askedContactsPermission) {
    navigate(Screens.ImportContacts)
  } else if (!startedVerification) {
    navigate(Screens.VerifyEducation)
  } else if (!numberVerified) {
    navigate(Screens.VerifyVerifying)
  } else {
    navigate(Stacks.AppStack)
  }
}

export function handleDeepLink(deepLink: string) {
  Logger.debug(TAG, 'Handling deep link', deepLink)
  handleDappkitDeepLink(deepLink)
  // Other deep link handlers can go here later
}

export function* appSaga() {
  yield spawn(checkAppDeprecation)
  yield spawn(navigateToProperScreen)
  yield spawn(toggleToProperSyncMode)
}
