import DeviceInfo from 'react-native-device-info'
import { REHYDRATE } from 'redux-persist/es/constants'
import { all, call, put, select, spawn, take } from 'redux-saga/effects'
import { setLanguage } from 'src/app/actions'
import { getVersionInfo } from 'src/firebase/firebase'
import { waitForFirebaseAuth } from 'src/firebase/saga'
import { NavActions, navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
import { PersistedRootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { clockInSync } from 'src/utils/time'

const TAG = 'app/saga'

export function* waitForRehydrate() {
  yield take(REHYDRATE)
  return
}

interface PersistedStateProps {
  language: string | null
  e164Number: string
  numberVerified: boolean
  pincodeSet: boolean
  redeemComplete: boolean
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
    pincodeSet: state.account.pincodeSet,
    redeemComplete: state.invite.redeemComplete,
    startedVerification: state.identity.startedVerification,
    askedContactsPermission: state.identity.askedContactsPermission,
  }
}

export function* checkAppDeprecation() {
  yield call(waitForRehydrate)
  yield call(waitForFirebaseAuth)
  const versionInfo = yield getVersionInfo(DeviceInfo.getVersion())
  Logger.info(TAG, 'Version Info', JSON.stringify(versionInfo))
  if (versionInfo && versionInfo.deprecated) {
    Logger.info(TAG, 'this version is deprecated')
    navigate(Screens.UpgradeScreen)
  }
}

export function* navigateToProperScreen() {
  yield all([take(REHYDRATE), take(NavActions.SET_NAVIGATOR)])
  const mappedState = yield select(mapStateToProps)
  if (!mappedState) {
    navigate(Stacks.NuxStack)
    return
  }

  const {
    language,
    e164Number,
    numberVerified,
    pincodeSet,
    redeemComplete,
    startedVerification,
    askedContactsPermission,
  } = mappedState

  if (language) {
    yield put(setLanguage(language))
  }

  const inSync = yield call(clockInSync)

  if (!language) {
    navigate(Stacks.NuxStack)
  } else if (!inSync) {
    navigate(Screens.SetClock)
  } else if (!e164Number) {
    navigate(Screens.JoinCelo)
  } else if (!pincodeSet) {
    navigate(Screens.Pincode)
  } else if (!redeemComplete) {
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

export function* appSaga() {
  yield spawn(checkAppDeprecation)
  yield spawn(navigateToProperScreen)
}
