import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import BigNumber from 'bignumber.js'
import { FeeInfo } from 'src/fees/saga'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import { TransactionContext } from 'src/transactions/types'

export interface EscrowedPayment {
  senderAddress: string
  recipientPhone: string
  paymentID: string
  currency: SHORT_CURRENCIES
  amount: BigNumber
  message?: string
  timestamp: BigNumber
  expirySeconds: BigNumber
}

export enum Actions {
  TRANSFER_PAYMENT = 'ESCROW/TRANSFER_PAYMENT',
  RECLAIM_PAYMENT = 'ESCROW/RECLAIM_PAYMENT',
  FETCH_SENT_PAYMENTS = 'ESCROW/FETCH_SENT_PAYMENTS',
  STORE_SENT_PAYMENTS = 'ESCROW/STORE_SENT_PAYMENTS',
  RESEND_PAYMENT = 'ESCROW/RESEND_PAYMENT',
  RECLAIM_PAYMENT_SUCCESS = 'ESCROW/RECLAIM_PAYMENT_SUCCESS',
  RECLAIM_PAYMENT_FAILURE = 'ESCROW/RECLAIM_PAYMENT_FAILURE',
  RECLAIM_PAYMENT_CANCEL = 'RECLAIM_PAYMENT_CANCEL',
}

export interface EscrowTransferPaymentAction {
  type: Actions.TRANSFER_PAYMENT
  phoneHashDetails: PhoneNumberHashDetails
  amount: BigNumber
  context: TransactionContext
  tempWalletAddress?: string
  feeInfo?: FeeInfo
}
export interface EscrowReclaimPaymentAction {
  type: Actions.RECLAIM_PAYMENT
  paymentID: string
}

export interface EscrowFetchSentPaymentsAction {
  type: Actions.FETCH_SENT_PAYMENTS
}

export interface EscrowStoreSentPaymentsAction {
  type: Actions.STORE_SENT_PAYMENTS
  sentPayments: EscrowedPayment[]
}

export interface EscrowResendPaymentAction {
  type: Actions.RESEND_PAYMENT
  paymentId: string
}

export interface EscrowReclaimPaymentSuccessAction {
  type: Actions.RECLAIM_PAYMENT_SUCCESS
}

export interface EscrowReclaimFailureAction {
  type: Actions.RECLAIM_PAYMENT_FAILURE
}

export interface EscrowReclaimCancelAction {
  type: Actions.RECLAIM_PAYMENT_CANCEL
}

export type ActionTypes =
  | EscrowTransferPaymentAction
  | EscrowReclaimPaymentAction
  | EscrowFetchSentPaymentsAction
  | EscrowStoreSentPaymentsAction
  | EscrowResendPaymentAction
  | EscrowReclaimPaymentSuccessAction
  | EscrowReclaimFailureAction
  | EscrowReclaimCancelAction

export const transferEscrowedPayment = (
  phoneHashDetails: PhoneNumberHashDetails,
  amount: BigNumber,
  context: TransactionContext,
  tempWalletAddress?: string,
  feeInfo?: FeeInfo
): EscrowTransferPaymentAction => ({
  type: Actions.TRANSFER_PAYMENT,
  phoneHashDetails,
  amount,
  context,
  tempWalletAddress,
  feeInfo,
})

export const reclaimEscrowPayment = (paymentID: string): EscrowReclaimPaymentAction => ({
  type: Actions.RECLAIM_PAYMENT,
  paymentID,
})

export const fetchSentEscrowPayments = (): EscrowFetchSentPaymentsAction => ({
  type: Actions.FETCH_SENT_PAYMENTS,
})

export const storeSentEscrowPayments = (
  sentPayments: EscrowedPayment[]
): EscrowStoreSentPaymentsAction => ({
  type: Actions.STORE_SENT_PAYMENTS,
  sentPayments,
})

export const resendEscrowPayment = (paymentId: string): EscrowResendPaymentAction => ({
  type: Actions.RESEND_PAYMENT,
  paymentId,
})

export const reclaimEscrowPaymentSuccess = (): EscrowReclaimPaymentSuccessAction => ({
  type: Actions.RECLAIM_PAYMENT_SUCCESS,
})

export const reclaimEscrowPaymentFailure = (): EscrowReclaimFailureAction => ({
  type: Actions.RECLAIM_PAYMENT_FAILURE,
})

export const reclaimEscrowPaymentCancel = (): EscrowReclaimCancelAction => ({
  type: Actions.RECLAIM_PAYMENT_CANCEL,
})
