import { getStableTokenContract } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { Notification } from 'react-native-firebase/notifications'
import {
  NotificationReceiveState,
  NotificationTypes,
  PaymentRequest,
  TransferNotificationData,
} from 'src/account'
import { showMessage } from 'src/alert/actions'
import { ERROR_BANNER_DURATION } from 'src/config'
import { resolveCurrency } from 'src/geth/consts'
import { refreshAllBalances } from 'src/home/actions'
import { lookupPhoneNumberAddress } from 'src/identity/verification'
import { DispatchType, GetStateType } from 'src/redux/reducers'
import { updateSuggestedFee } from 'src/send/actions'
import {
  navigateToPaymentTransferReview,
  navigateToRequestedPaymentReview,
} from 'src/transactions/actions'
import { TransactionTypes } from 'src/transactions/reducer'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { getRecipientFromAddress, phoneNumberToRecipient } from 'src/utils/recipient'

const TAG = 'FirebaseNotifications'

const handlePaymentRequested = (
  paymentRequest: PaymentRequest,
  notificationState: NotificationReceiveState
) => async (dispatch: DispatchType, getState: GetStateType) => {
  if (notificationState === NotificationReceiveState.APP_ALREADY_OPEN) {
    return
  }
  const { e164NumberToAddress } = getState().identity
  const { recipientCache } = getState().send
  let requesterAddress = e164NumberToAddress[paymentRequest.requesterE164Number]
  if (!requesterAddress) {
    const resolvedAddress = await lookupPhoneNumberAddress(paymentRequest.requesterE164Number)
    if (!resolvedAddress) {
      Logger.error(TAG, 'Unable to resolve requester address')
      return
    }
    requesterAddress = resolvedAddress
  }
  const recipient = phoneNumberToRecipient(
    paymentRequest.requesterE164Number,
    requesterAddress,
    recipientCache
  )

  const fee = await dispatch(
    updateSuggestedFee(true, getStableTokenContract, {
      recipientAddress: requesterAddress!,
      amount: paymentRequest.amount,
      comment: paymentRequest.comment,
    })
  )

  navigateToRequestedPaymentReview({
    recipient,
    amount: new BigNumber(paymentRequest.amount),
    reason: paymentRequest.comment,
    recipientAddress: requesterAddress!,
    fee,
  })
}

const handlePaymentReceived = (
  transferNotification: TransferNotificationData,
  notificationState: NotificationReceiveState
) => async (dispatch: DispatchType, getState: GetStateType) => {
  dispatch(refreshAllBalances())

  if (notificationState !== NotificationReceiveState.APP_ALREADY_OPEN) {
    const { recipientCache } = getState().send
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
    dispatch(showMessage(notification.title, ERROR_BANNER_DURATION))
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
