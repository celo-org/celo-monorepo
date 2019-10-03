import BigNumber from 'bignumber.js'
import { Notification } from 'react-native-firebase/notifications'
import {
  NotificationReceiveState,
  NotificationTypes,
  PaymentRequest,
  TransferNotificationData,
} from 'src/account'
import { showMessage } from 'src/alert/actions'
import { resolveCurrency } from 'src/geth/consts'
import { refreshAllBalances } from 'src/home/actions'
import { getRecipientFromPaymentRequest } from 'src/paymentRequest/utils'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { DispatchType, GetStateType } from 'src/redux/reducers'
import {
  navigateToPaymentTransferReview,
  navigateToRequestedPaymentReview,
} from 'src/transactions/actions'
import { TransactionTypes } from 'src/transactions/reducer'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

const TAG = 'FirebaseNotifications'

const handlePaymentRequested = (
  paymentRequest: PaymentRequest,
  notificationState: NotificationReceiveState
) => async (dispatch: DispatchType, getState: GetStateType) => {
  if (notificationState === NotificationReceiveState.APP_ALREADY_OPEN) {
    return
  }

  if (!paymentRequest.requesterAddress) {
    Logger.error(TAG, 'Payment request must specify a requester address')
    return
  }

  const { recipientCache } = getState().recipients
  const targetRecipient = getRecipientFromPaymentRequest(paymentRequest, recipientCache)

  navigateToRequestedPaymentReview({
    recipient: targetRecipient,
    amount: new BigNumber(paymentRequest.amount),
    reason: paymentRequest.comment,
    recipientAddress: targetRecipient.address,
    type: TransactionTypes.PAY_REQUEST,
  })
}

const handlePaymentReceived = (
  transferNotification: TransferNotificationData,
  notificationState: NotificationReceiveState
) => async (dispatch: DispatchType, getState: GetStateType) => {
  dispatch(refreshAllBalances())

  if (notificationState !== NotificationReceiveState.APP_ALREADY_OPEN) {
    const { recipientCache } = getState().recipients
    const { addressToE164Number } = getState().identity
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

export const handleNotification = (
  notification: Notification,
  notificationState: NotificationReceiveState
) => async (dispatch: DispatchType, getState: GetStateType) => {
  if (notificationState === NotificationReceiveState.APP_ALREADY_OPEN) {
    dispatch(showMessage(notification.title))
  }
  switch (notification.data.type) {
    case NotificationTypes.PAYMENT_REQUESTED:
      dispatch(handlePaymentRequested(notification.data, notificationState))
      break

    case NotificationTypes.PAYMENT_RECEIVED:
      dispatch(handlePaymentReceived(notification.data, notificationState))
      break

    default:
      Logger.info(TAG, `Got unknown notification type ${notification.data.type}`)
      break
  }
}
