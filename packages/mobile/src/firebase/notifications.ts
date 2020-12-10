import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import BigNumber from 'bignumber.js'
import { call, put, select } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { TokenTransactionType } from 'src/apollo/types'
import { openUrl } from 'src/app/actions'
import { CURRENCIES, resolveCurrency } from 'src/geth/consts'
import { addressToE164NumberSelector } from 'src/identity/reducer'
import {
  NotificationReceiveState,
  NotificationTypes,
  TransferNotificationData,
} from 'src/notifications/types'
import { PaymentRequest } from 'src/paymentRequest/types'
import { getRequesterFromPaymentRequest } from 'src/paymentRequest/utils'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import {
  navigateToPaymentTransferReview,
  navigateToRequestedPaymentReview,
} from 'src/transactions/actions'
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

  const addressToE164Number = yield select(addressToE164NumberSelector)
  const recipientCache = yield select(recipientCacheSelector)
  const targetRecipient = getRequesterFromPaymentRequest(
    paymentRequest,
    addressToE164Number,
    recipientCache
  )

  navigateToRequestedPaymentReview({
    firebasePendingRequestUid: paymentRequest.uid,
    recipient: targetRecipient,
    amount: new BigNumber(paymentRequest.amount),
    reason: paymentRequest.comment,
    type: TokenTransactionType.PayRequest,
  })
}

function* handlePaymentReceived(
  transferNotification: TransferNotificationData,
  notificationState: NotificationReceiveState
) {
  if (notificationState !== NotificationReceiveState.APP_ALREADY_OPEN) {
    const recipientCache = yield select(recipientCacheSelector)
    const addressToE164Number = yield select(addressToE164NumberSelector)
    const address = transferNotification.sender.toLowerCase()
    const currency = resolveCurrency(transferNotification.currency)

    navigateToPaymentTransferReview(
      TokenTransactionType.Received,
      new BigNumber(transferNotification.timestamp).toNumber(),
      {
        amount: {
          value: divideByWei(transferNotification.value),
          currencyCode: CURRENCIES[currency].code,
        },
        address: transferNotification.sender.toLowerCase(),
        comment: transferNotification.comment,
        recipient: getRecipientFromAddress(address, addressToE164Number, recipientCache),
        type: TokenTransactionType.Received,
      }
    )
  }
}

export function* handleNotification(
  message: FirebaseMessagingTypes.RemoteMessage,
  notificationState: NotificationReceiveState
) {
  // See if this is a notification with an open url action (`ou` prop in the data)
  const urlToOpen = message.data?.ou

  if (notificationState === NotificationReceiveState.APP_ALREADY_OPEN) {
    const { title, body } = message.notification ?? {}
    if (title) {
      yield put(
        showMessage(
          body || title,
          undefined,
          null,
          urlToOpen ? openUrl(urlToOpen) : null,
          body ? title : null
        )
      )
    }
  } else {
    // Notification was received while app wasn't already open (i.e. tapped to act on it)
    // So directly handle the action if any
    if (urlToOpen) {
      yield put(openUrl(urlToOpen))
      return
    }
  }

  switch (message.data?.type) {
    case NotificationTypes.PAYMENT_REQUESTED:
      yield call(
        handlePaymentRequested,
        (message.data as unknown) as PaymentRequest,
        notificationState
      )
      break

    case NotificationTypes.PAYMENT_RECEIVED:
      yield call(
        handlePaymentReceived,
        (message.data as unknown) as TransferNotificationData,
        notificationState
      )
      break

    default:
      Logger.info(TAG, `Got unknown notification type ${message.data?.type}`)
      break
  }
}
