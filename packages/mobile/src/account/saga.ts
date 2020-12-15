import firebase from '@react-native-firebase/app'
import { call, put, spawn, take, takeLeading } from 'redux-saga/effects'
import {
  Actions,
  ClearStoredAccountAction,
  initializeAccountFailure,
  initializeAccountSuccess,
  SetPincodeAction,
  setPincodeFailure,
  setPincodeSuccess,
} from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { clearStoredMnemonic } from 'src/backup/utils'
import { FIREBASE_ENABLED } from 'src/config'
import { firebaseSignOut } from 'src/firebase/firebase'
import { deleteNodeData } from 'src/geth/geth'
import { refreshAllBalances } from 'src/home/actions'
import { removeAccountLocally } from 'src/pincode/authentication'
import { persistor } from 'src/redux/store'
import { restartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'
import { getOrCreateAccount } from 'src/web3/saga'

const TAG = 'account/saga'

export const SENTINEL_MIGRATE_COMMENT = '__CELO_MIGRATE_TX__'

export function* setPincode({ pincodeType }: SetPincodeAction) {
  try {
    // TODO hooks into biometrics will likely go here
    // But for now this saga does not to much, most cut during the auth refactor
    yield put(setPincodeSuccess(pincodeType))
    Logger.info(TAG + '@setPincode', 'Pincode set successfully')
  } catch (error) {
    Logger.error(TAG + '@setPincode', 'Failed to set pincode', error)
    ValoraAnalytics.track(OnboardingEvents.pin_failed_to_set, { error: error.message, pincodeType })
    yield put(showError(ErrorMessages.SET_PIN_FAILED))
    yield put(setPincodeFailure())
  }
}

function* clearStoredAccountSaga({ account }: ClearStoredAccountAction) {
  try {
    yield call(removeAccountLocally, account)
    yield call(clearStoredMnemonic)
    yield call(ValoraAnalytics.reset)
    yield call(deleteNodeData)

    // Ignore error if it was caused by Firebase.
    try {
      yield call(firebaseSignOut, firebase.app())
    } catch (error) {
      if (FIREBASE_ENABLED) {
        Logger.error(TAG + '@clearStoredAccount', 'Failed to sign out from Firebase', error)
      }
    }

    yield call(persistor.flush)
    yield call(restartApp)
  } catch (error) {
    Logger.error(TAG + '@clearStoredAccount', 'Error while removing account', error)
    yield put(showError(ErrorMessages.ACCOUNT_CLEAR_FAILED))
  }
}

function* initializeAccount() {
  Logger.debug(TAG + '@initializeAccount', 'Creating account')
  try {
    ValoraAnalytics.track(OnboardingEvents.initialize_account_start)
    yield call(getOrCreateAccount)
    yield put(refreshAllBalances())
    Logger.debug(TAG + '@initializeAccount', 'Account creation success')
    ValoraAnalytics.track(OnboardingEvents.initialize_account_complete)
    yield put(initializeAccountSuccess())
  } catch (e) {
    Logger.error(TAG, 'Failed to initialize account', e)
    ValoraAnalytics.track(OnboardingEvents.initialize_account_error, { error: e.message })
    yield put(initializeAccountFailure())
  }
}

export function* watchSetPincode() {
  yield takeLeading(Actions.SET_PINCODE, setPincode)
}

export function* watchClearStoredAccount() {
  const action = yield take(Actions.CLEAR_STORED_ACCOUNT)
  yield call(clearStoredAccountSaga, action)
}

export function* watchInitializeAccount() {
  yield takeLeading(Actions.INITIALIZE_ACCOUNT, initializeAccount)
}

export function* accountSaga() {
  yield spawn(watchSetPincode)
  yield spawn(watchClearStoredAccount)
  yield spawn(watchInitializeAccount)
}
