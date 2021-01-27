import firebase from '@react-native-firebase/app'
import { FirebaseDatabaseTypes } from '@react-native-firebase/database'
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
import { showError } from 'src/alert/actions'
import { RequestEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { waitForFirebaseAuth } from 'src/firebase/saga'
import { navigateHome } from 'src/navigator/NavigationService'
import {
  Actions,
  CancelPaymentRequestAction,
  CompletePaymentRequestAction,
  DeclinePaymentRequestAction,
  updateIncomingPaymentRequests,
  UpdateIncomingPaymentRequestsAction,
  updateOutgoingPaymentRequests,
  UpdateOutgoingPaymentRequestsAction,
  UpdatePaymentRequestNotifiedAction,
  WritePaymentRequestAction,
} from 'src/paymentRequest/actions'
import { PaymentRequest, PaymentRequestStatus } from 'src/paymentRequest/types'
import { decryptPaymentRequest, encryptPaymentRequest } from 'src/paymentRequest/utils'
import Logger from 'src/utils/Logger'
import { getAccount } from 'src/web3/saga'
import { currentAccountSelector, dataEncryptionKeySelector } from 'src/web3/selectors'

const TAG = 'paymentRequests/saga'
const VALUE_CHANGE_HOOK = 'value'
const REQUEST_DB = 'pendingRequests'
const REQUESTEE_ADDRESS = 'requesteeAddress'
const REQUESTER_ADDRESS = 'requesterAddress'
type ADDRESS_KEY_FIELD = typeof REQUESTEE_ADDRESS | typeof REQUESTER_ADDRESS

function createPaymentRequestChannel(address: string, addressKeyField: ADDRESS_KEY_FIELD) {
  const errorCallback = (error: Error) => {
    Logger.error(TAG, 'Error getting payment requests from firebase', error)
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
  ) => UpdateIncomingPaymentRequestsAction | UpdateOutgoingPaymentRequestsAction,
  isOutgoingRequest: boolean
) {
  yield all([call(waitForFirebaseAuth), call(getAccount)])
  const address = yield select(currentAccountSelector)
  const dataEncryptionKey: string | null = yield select(dataEncryptionKeySelector)
  const paymentRequestChannel = yield createPaymentRequestChannel(address, addressKeyField)
  while (true) {
    try {
      const paymentRequestsObject: { [key: string]: PaymentRequest } = yield take(
        paymentRequestChannel
      )
      Logger.debug(`${TAG}@subscribeToPaymentRequests`, 'New payment request object from channel')
      const paymentRequests: PaymentRequest[] = Object.keys(paymentRequestsObject)
        .map((key) => ({
          uid: key,
          ...paymentRequestsObject[key],
        }))
        .sort(compareTimestamps)
        .filter(onlyRequested)
        .map((pr) => decryptPaymentRequest(pr, dataEncryptionKey, isOutgoingRequest))

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

function* paymentRequestWriter({ paymentRequest }: WritePaymentRequestAction) {
  try {
    Logger.info(TAG, `Writing pending request to database`)

    const encryptedPaymentRequest: PaymentRequest = yield call(
      encryptPaymentRequest,
      paymentRequest
    )

    const pendingRequestRef = firebase.database().ref(`pendingRequests`)
    yield call(() => pendingRequestRef.push(encryptedPaymentRequest))

    navigateHome()
  } catch (error) {
    Logger.error(TAG, 'Failed to write payment request to Firebase DB', error)
    ValoraAnalytics.track(RequestEvents.request_error, { error: error.message })
    yield put(showError(ErrorMessages.PAYMENT_REQUEST_FAILED))
  }
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

function* updatePaymentRequestStatus({
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

function* subscribeToIncomingPaymentRequests() {
  yield call(subscribeToPaymentRequests, REQUESTEE_ADDRESS, updateIncomingPaymentRequests, false)
}

function* subscribeToOutgoingPaymentRequests() {
  yield call(subscribeToPaymentRequests, REQUESTER_ADDRESS, updateOutgoingPaymentRequests, true)
}

function* watchPaymentRequestStatusUpdates() {
  yield takeLeading(Actions.UPDATE_REQUEST_STATUS, updatePaymentRequestStatus)
}

function* watchPaymentRequestNotifiedUpdates() {
  yield takeLeading(Actions.UPDATE_REQUEST_NOTIFIED, updatePaymentRequestNotified)
}

function* watchWritePaymentRequest() {
  yield takeEvery(Actions.WRITE_PAYMENT_REQUEST, paymentRequestWriter)
}

export function* paymentRequestSaga() {
  yield spawn(subscribeToIncomingPaymentRequests)
  yield spawn(subscribeToOutgoingPaymentRequests)
  yield spawn(watchPaymentRequestStatusUpdates)
  yield spawn(watchPaymentRequestNotifiedUpdates)
  yield spawn(watchWritePaymentRequest)
}
