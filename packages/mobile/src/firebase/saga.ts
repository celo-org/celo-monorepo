import firebase from 'react-native-firebase'
import { DataSnapshot } from 'react-native-firebase/database'
import { eventChannel } from 'redux-saga'
import {
  all,
  call,
  cancelled,
  put,
  select,
  spawn,
  take,
  takeEvery,
  takeLeading,
} from 'redux-saga/effects'
import {
  updateIncomingPaymentRequests,
  UpdateIncomingPaymentRequestsAction,
  updateOutgoingPaymentRequests,
  UpdateOutgoingPaymentRequestsAction,
} from 'src/account/actions'
import { PaymentRequest, PaymentRequestStatus } from 'src/account/types'
import { showError } from 'src/alert/actions'
import { Actions as AppActions, SetLanguage } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { FIREBASE_ENABLED } from 'src/config'
import {
  Actions,
  firebaseAuthorized,
  UpdatePaymentRequestNotifiedAction,
  UpdatePaymentRequestStatusAction,
} from 'src/firebase/actions'
import {
  initializeAuth,
  initializeCloudMessaging,
  paymentRequestWriter,
  setUserLanguage,
} from 'src/firebase/firebase'
import Logger from 'src/utils/Logger'
import { getAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'firebase/saga'
const REQUEST_DB = 'pendingRequests'
const REQUESTEE_ADDRESS = 'requesteeAddress'
const REQUESTER_ADDRESS = 'requesterAddress'
const VALUE = 'value'

type ADDRESS_KEY_FIELD = typeof REQUESTEE_ADDRESS | typeof REQUESTER_ADDRESS

let firebaseAlreadyAuthorized = false
export function* waitForFirebaseAuth() {
  if (firebaseAlreadyAuthorized) {
    return
  }
  yield take(Actions.AUTHORIZED)
  firebaseAlreadyAuthorized = true
  return
}

function* initializeFirebase() {
  const address = yield call(getAccount)
  if (!FIREBASE_ENABLED) {
    Logger.info(TAG, 'Firebase disabled')
    yield put(showError(ErrorMessages.FIREBASE_DISABLED))
    return
  }

  Logger.info(TAG, 'Firebase enabled')
  try {
    const app = firebase.app()
    Logger.info(
      TAG,
      `Initializing Firebase for app ${app.name}, appId ${app.options.appId}, db url ${app.options.databaseURL}`
    )
    yield call(initializeAuth, firebase, address)
    yield put(firebaseAuthorized())
    yield call(initializeCloudMessaging, firebase, address)
    Logger.info(TAG, `Firebase initialized`)

    return
  } catch (error) {
    Logger.error(TAG, 'Error while initializing firebase', error)
    yield put(showError(ErrorMessages.FIREBASE_FAILED))
  }
}

function createPaymentRequestChannel(address: string, addressKeyField: ADDRESS_KEY_FIELD) {
  const errorCallback = (error: Error) => {
    Logger.warn(TAG, error.toString())
  }

  return eventChannel((emit: any) => {
    const emitter = (data: DataSnapshot) => {
      if (data.toJSON()) {
        emit(data.toJSON())
      }
    }

    const cancel = () => {
      firebase
        .database()
        .ref(REQUEST_DB)
        .orderByChild(addressKeyField)
        .equalTo(address)
        .off(VALUE, emitter)
    }

    firebase
      .database()
      .ref(REQUEST_DB)
      .orderByChild(addressKeyField)
      .equalTo(address)
      .on(VALUE, emitter, errorCallback)
    return cancel
  })
}

const compareTimestamps = (a: PaymentRequest, b: PaymentRequest) => {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
}

const onlyRequested = (pr: PaymentRequest) => pr.status === PaymentRequestStatus.REQUESTED

function* subscribeToPaymentRequests(
  addressKeyField: ADDRESS_KEY_FIELD,
  updatePaymentRequestsActionCreator: (
    paymentRequests: PaymentRequest[]
  ) => UpdateIncomingPaymentRequestsAction | UpdateOutgoingPaymentRequestsAction
) {
  yield all([call(waitForFirebaseAuth), call(getAccount)])
  const address = yield select(currentAccountSelector)
  const paymentRequestChannel = yield createPaymentRequestChannel(address, addressKeyField)
  while (true) {
    try {
      const paymentRequestsObject = yield take(paymentRequestChannel)
      const paymentRequests = Object.keys(paymentRequestsObject)
        .map((key) => ({
          uid: key,
          ...paymentRequestsObject[key],
        }))
        .sort(compareTimestamps)
        .filter(onlyRequested)
      yield put(updatePaymentRequestsActionCreator(paymentRequests))
    } catch (error) {
      Logger.error(`${TAG}@subscribeToPaymentRequests`, error)
    } finally {
      if (yield cancelled()) {
        paymentRequestChannel.close()
      }
    }
  }
}

function* subscribeToIncomingPaymentRequests() {
  yield subscribeToPaymentRequests(REQUESTEE_ADDRESS, updateIncomingPaymentRequests)
}

function* subscribeToOutgoingPaymentRequests() {
  yield subscribeToPaymentRequests(REQUESTER_ADDRESS, updateOutgoingPaymentRequests)
}

function* updatePaymentRequestStatus({ id, status }: UpdatePaymentRequestStatusAction) {
  try {
    Logger.debug(TAG, 'Updating payment request', id, `status: ${status}`)
    yield call(() =>
      firebase
        .database()
        .ref(`${REQUEST_DB}/${id}`)
        .update({ status })
    )
    Logger.debug(TAG, 'Payment request status updated', id)
  } catch (error) {
    yield put(showError(ErrorMessages.PAYMENT_REQUEST_UPDATE_FAILED))
    Logger.error(TAG, `Error while updating payment request ${id} status`, error)
  }
}

export function* watchPaymentRequestStatusUpdates() {
  yield takeLeading(Actions.PAYMENT_REQUEST_UPDATE_STATUS, updatePaymentRequestStatus)
}

function* updatePaymentRequestNotified({ id, notified }: UpdatePaymentRequestNotifiedAction) {
  try {
    Logger.debug(TAG, 'Updating payment request', id, `notified: ${notified}`)
    yield call(() =>
      firebase
        .database()
        .ref(`${REQUEST_DB}/${id}`)
        .update({ notified })
    )
    Logger.debug(TAG, 'Payment request notified updated', id)
  } catch (error) {
    yield put(showError(ErrorMessages.PAYMENT_REQUEST_UPDATE_FAILED))
    Logger.error(TAG, `Error while updating payment request ${id} status`, error)
  }
}

export function* watchPaymentRequestNotifiedUpdates() {
  yield takeLeading(Actions.PAYMENT_REQUEST_UPDATE_NOTIFIED, updatePaymentRequestNotified)
}

export function* syncLanguageSelection({ language }: SetLanguage) {
  yield call(waitForFirebaseAuth)
  const address = yield select(currentAccountSelector)
  try {
    yield call(setUserLanguage, address, language)
  } catch (error) {
    Logger.error(TAG, 'Syncing language selection to Firebase failed', error)
  }
}

export function* watchLanguage() {
  yield takeEvery(AppActions.SET_LANGUAGE, syncLanguageSelection)
}

export function* watchWritePaymentRequest() {
  yield takeEvery(Actions.PAYMENT_REQUEST_WRITE, paymentRequestWriter)
}

export function* firebaseSaga() {
  yield spawn(initializeFirebase)
  yield spawn(watchLanguage)
  yield spawn(subscribeToIncomingPaymentRequests)
  yield spawn(subscribeToOutgoingPaymentRequests)
  yield spawn(watchPaymentRequestStatusUpdates)
  yield spawn(watchPaymentRequestNotifiedUpdates)
  yield spawn(watchWritePaymentRequest)
}
