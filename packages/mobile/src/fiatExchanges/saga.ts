import BigNumber from 'bignumber.js'
import { call, race, spawn, take, takeLeading } from 'redux-saga/effects'
import { TokenTransactionType } from 'src/apollo/types'
import { Actions as AppActions, ActionTypes as AppActionTypes } from 'src/app/actions'
import { Actions, BidaliPaymentRequestedAction } from 'src/fiatExchanges/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RecipientKind, RecipientWithAddress } from 'src/recipients/recipient'
import { Actions as SendActions } from 'src/send/actions'
import { TransactionDataInput } from 'src/send/SendAmount'
import Logger from 'src/utils/Logger'

const TAG = 'fiatExchanges/saga'

function* bidaliPaymentRequest({
  amount,
  address,
  currency,
  description,
  chargeId,
  onPaymentSent,
  onCancelled,
}: BidaliPaymentRequestedAction) {
  Logger.debug(
    `${TAG}@bidaliPaymentRequest`,
    `Send ${amount} ${currency} to ${address} for ${description} (${chargeId})`
  )

  if (currency.toUpperCase() !== 'CUSD') {
    // This is not supposed to happen in production, the current flow limits
    // to cUSD only
    throw new Error(`Unsupported payment currency from Bidali: ${currency}`)
  }

  const recipient: RecipientWithAddress = {
    kind: RecipientKind.Address,
    address,
    displayId: 'BIDALI',
    displayName: 'Bidali',
    // displayName: data.displayName || cachedRecipient?.displayName || 'anonymous',
    // e164PhoneNumber: data.e164PhoneNumber,
    // phoneNumberLabel: cachedRecipient?.phoneNumberLabel,
    // thumbnailPath: cachedRecipient?.thumbnailPath,
    // contactId: cachedRecipient?.contactId,
  }
  const transactionData: TransactionDataInput = {
    recipient,
    amount: new BigNumber(amount),
    reason: `${description} (${chargeId})`,
    type: TokenTransactionType.PayPrefill,
  }
  navigate(Screens.SendConfirmationModal, {
    transactionData,
    isFromScan: true,
  })

  while (true) {
    const { cancel } = yield race({
      sendStart: take(SendActions.SEND_PAYMENT_OR_INVITE),
      cancel: take(
        (action: AppActionTypes) =>
          action.type === AppActions.ACTIVE_SCREEN_CHANGED &&
          action.activeScreen === Screens.BidaliScreen
      ),
    })

    if (cancel) {
      Logger.debug(`${TAG}@bidaliPaymentRequest`, 'Cancelled')
      yield call(onCancelled)
      return
    }

    const { success } = yield race({
      success: take(SendActions.SEND_PAYMENT_OR_INVITE_SUCCESS),
      failure: take(SendActions.SEND_PAYMENT_OR_INVITE_FAILURE),
    })

    if (success) {
      Logger.debug(`${TAG}@bidaliPaymentRequest`, 'Payment Sent')
      yield call(onPaymentSent)
      break
    }

    // Failure, loop again and see if the user is gonna try to send it again or just navigate back
  }
}

export function* watchBidaliPaymentRequests() {
  yield takeLeading(Actions.BIDALI_PAYMENT_REQUESTED, bidaliPaymentRequest)
}

export function* fiatExchangesSaga() {
  yield spawn(watchBidaliPaymentRequests)
}
