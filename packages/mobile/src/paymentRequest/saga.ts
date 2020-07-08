import firebase from '@react-native-firebase/app'
import { FirebaseDatabaseTypes } from '@react-native-firebase/database'
import { take } from 'lodash'
import { eventChannel } from 'redux-saga'
import { select } from 'redux-saga-test-plan/matchers'
import { all, call, cancelled, put, spawn, takeEvery, takeLeading } from 'redux-saga/effects'
import {
  updateIncomingPaymentRequests,
  UpdateIncomingPaymentRequestsAction,
  updateOutgoingPaymentRequests,
  UpdateOutgoingPaymentRequestsAction,
} from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { RequestEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  CancelPaymentRequestAction,
  CompletePaymentRequestAction,
  DeclinePaymentRequestAction,
  UpdatePaymentRequestNotifiedAction,
  WritePaymentRequest,
} from 'src/firebase/actions'
import { waitForFirebaseAuth } from 'src/firebase/saga'
import { navigateHome } from 'src/navigator/NavigationService'
import { PaymentRequest, PaymentRequestStatus } from 'src/paymentRequest/types'
import Logger from 'src/utils/Logger'
import { getAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'firebase/paymentRequests'
const VALUE_CHANGE_HOOK = 'value'
const REQUEST_DB = 'pendingRequests'
const REQUESTEE_ADDRESS = 'requesteeAddress'
const REQUESTER_ADDRESS = 'requesterAddress'
type ADDRESS_KEY_FIELD = typeof REQUESTEE_ADDRESS | typeof REQUESTER_ADDRESS

function createPaymentRequestChannel(address: string, addressKeyField: ADDRESS_KEY_FIELD) {
  const errorCallback = (error: Error) => {
    Logger.warn(TAG, error.toString())
  }

  return eventChannel((emit: any) => {
    const emitter = (data: FirebaseDatabaseTypes.DataSnapshot) => {
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
        .off(VALUE_CHANGE_HOOK, emitter)
    }

    firebase
      .database()
      .ref(REQUEST_DB)
      .orderByChild(addressKeyField)
      .equalTo(address)
      .on(VALUE_CHANGE_HOOK, emitter, errorCallback)
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

export function* paymentRequestWriter({ paymentInfo }: WritePaymentRequest) {
  try {
    Logger.info(TAG, `Writing pending request to database`)
    const pendingRequestRef = firebase.database().ref(`pendingRequests`)
    yield call(() => pendingRequestRef.push(paymentInfo))

    navigateHome()
  } catch (error) {
    Logger.error(TAG, 'Failed to write payment request to Firebase DB', error)
    ValoraAnalytics.track(RequestEvents.request_error, { error: error.message })
    yield put(showError(ErrorMessages.PAYMENT_REQUEST_FAILED))
  }
}

export function* updatePaymentRequestNotified({
  id,
  notified,
}: UpdatePaymentRequestNotifiedAction) {
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

export function* updatePaymentRequestStatus({
  id,
  status,
}: (DeclinePaymentRequestAction | CompletePaymentRequestAction) | CancelPaymentRequestAction) {
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

export function* subscribeToIncomingPaymentRequests() {
  yield subscribeToPaymentRequests(REQUESTEE_ADDRESS, updateIncomingPaymentRequests)
}

export function* subscribeToOutgoingPaymentRequests() {
  yield subscribeToPaymentRequests(REQUESTER_ADDRESS, updateOutgoingPaymentRequests)
}

export function* watchPaymentRequestStatusUpdates() {
  yield takeLeading(Actions.PAYMENT_REQUEST_UPDATE_STATUS, updatePaymentRequestStatus)
}

export function* watchPaymentRequestNotifiedUpdates() {
  yield takeLeading(Actions.PAYMENT_REQUEST_UPDATE_NOTIFIED, updatePaymentRequestNotified)
}

export function* watchWritePaymentRequest() {
  yield takeEvery(Actions.PAYMENT_REQUEST_WRITE, paymentRequestWriter)
}

export function* paymentRequestSaga() {
  yield spawn(subscribeToIncomingPaymentRequests)
  yield spawn(subscribeToOutgoingPaymentRequests)
  yield spawn(watchPaymentRequestStatusUpdates)
  yield spawn(watchPaymentRequestNotifiedUpdates)
  yield spawn(watchWritePaymentRequest)
}
