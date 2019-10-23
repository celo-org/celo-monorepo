import BigNumber from 'bignumber.js'
import { Notification } from 'react-native-firebase/notifications'
import { call, put, select } from 'redux-saga/effects'
import {
  NotificationReceiveState,
  NotificationTypes,
  PaymentRequest,
  TransferNotificationData,
} from 'src/account'
import { showMessage } from 'src/alert/actions'
import { resolveCurrency } from 'src/geth/consts'
import { refreshAllBalances } from 'src/home/actions'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import { getRecipientFromPaymentRequest } from 'src/paymentRequest/utils'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import {
  navigateToPaymentTransferReview,
  navigateToRequestedPaymentReview,
} from 'src/transactions/actions'
import { TransactionTypes } from 'src/transactions/reducer'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

const TAG = 'FirebaseNotifications'

function* handlePaymentRequested(
  paymentRequest: PaymentRequest,
  notificationState: NotificationReceiveState
) {
  if (notificationState === NotificationReceiveState.APP_ALREADY_OPEN) {
    return
  }

  if (!paymentRequest.requesterAddress) {
    Logger.error(TAG, 'Payment request must specify a requester address')
    return
  }

  const recipientCache = yield select(recipientCacheSelector)
  const targetRecipient = getRecipientFromPaymentRequest(paymentRequest, recipientCache)

  navigateToRequestedPaymentReview({
    recipient: targetRecipient,
    amount: new BigNumber(paymentRequest.amount),
    reason: paymentRequest.comment,
    recipientAddress: targetRecipient.address,
    type: TransactionTypes.PAY_REQUEST,
  })
}

function* handlePaymentReceived(
  transferNotification: TransferNotificationData,
  notificationState: NotificationReceiveState
) {
  yield put(refreshAllBalances())

  if (notificationState !== NotificationReceiveState.APP_ALREADY_OPEN) {
    const recipientCache = yield select(recipientCacheSelector)
    const addressToE164Number = yield select(addressToE164NumberSelector)
    const address = transferNotification.sender.toLowerCase()

    navigateToPaymentTransferReview(
      TransactionTypes.RECEIVED,
      new BigNumber(transferNotification.timestamp).toNumber(),
      {
        value: divideByWei(transferNotification.value),
        currency: resolveCurrency(transferNotification.currency),
        address: transferNotification.sender.toLowerCase(),
        comment: transferNotification.comment,
        recipient: getRecipientFromAddress(address, addressToE164Number, recipientCache),
        type: TransactionTypes.RECEIVED,
      }
    )
  }
}

export function* handleNotification(
  notification: Notification,
  notificationState: NotificationReceiveState
) {
  if (notificationState === NotificationReceiveState.APP_ALREADY_OPEN) {
    yield put(showMessage(notification.title))
  }
  switch (notification.data.type) {
    case NotificationTypes.PAYMENT_REQUESTED:
      yield call(handlePaymentRequested, notification.data, notificationState)
      break

    case NotificationTypes.PAYMENT_RECEIVED:
      yield call(handlePaymentReceived, notification.data, notificationState)
      break

    default:
      Logger.info(TAG, `Got unknown notification type ${notification.data.type}`)
      break
  }
}
