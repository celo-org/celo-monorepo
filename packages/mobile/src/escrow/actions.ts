import BigNumber from 'bignumber.js'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import { RecipientWithContact } from 'src/utils/recipient'

export interface EscrowedPayment {
  senderAddress: string
  recipientPhone: string
  recipientContact?: RecipientWithContact
  paymentID: string
  currency: SHORT_CURRENCIES
  amount: BigNumber
  message?: string
  timestamp: BigNumber
  expirySeconds: BigNumber
}

// The number of seconds before the sender can reclaim the payment.
export const EXPIRY_SECONDS = 432000 // 5 days in seconds

export enum Actions {
  TRANSFER_PAYMENT = 'ESCROW/TRANSFER_PAYMENT',
  RECLAIM_PAYMENT = 'ESCROW/RECLAIM_PAYMENT',
  FETCH_SENT_PAYMENTS = 'ESCROW/FETCH_SENT_PAYMENTS',
  STORE_SENT_PAYMENTS = 'ESCROW/STORE_SENT_PAYMENTS',
  RESEND_PAYMENT = 'ESCROW/RESEND_PAYMENT',
  RECLAIM_PAYMENT_SUCCESS = 'ESCROW/RECLAIM_PAYMENT_SUCCESS',
  RECLAIM_PAYMENT_FAILURE = 'ESCROW/RECLAIM_PAYMENT_FAILURE',
}

export interface TransferPaymentAction {
  type: Actions.TRANSFER_PAYMENT
  phoneHash: string
  amount: BigNumber
  tempWalletAddress: string
}
export interface ReclaimPaymentAction {
  type: Actions.RECLAIM_PAYMENT
  paymentID: string
}

export interface FetchSentPaymentsAction {
  type: Actions.FETCH_SENT_PAYMENTS
}

export interface StoreSentPaymentsAction {
  type: Actions.STORE_SENT_PAYMENTS
  sentPayments: EscrowedPayment[]
}

export interface ResendPaymentAction {
  type: Actions.RESEND_PAYMENT
  paymentId: string
}

export interface ReclaimPaymentSuccessAction {
  type: Actions.RECLAIM_PAYMENT_SUCCESS
}

export interface ReclaimFailureAction {
  type: Actions.RECLAIM_PAYMENT_FAILURE
  error: ErrorMessages
}

export type ActionTypes =
  | TransferPaymentAction
  | ReclaimPaymentAction
  | FetchSentPaymentsAction
  | StoreSentPaymentsAction
  | ResendPaymentAction
  | ReclaimPaymentSuccessAction
  | ReclaimFailureAction

export const transferEscrowedPayment = (
  phoneHash: string,
  amount: BigNumber,
  tempWalletAddress: string
): TransferPaymentAction => ({
  type: Actions.TRANSFER_PAYMENT,
  phoneHash,
  amount,
  tempWalletAddress,
})

export const reclaimPayment = (paymentID: string): ReclaimPaymentAction => ({
  type: Actions.RECLAIM_PAYMENT,
  paymentID,
})

export const fetchSentPayments = (): FetchSentPaymentsAction => ({
  type: Actions.FETCH_SENT_PAYMENTS,
})

export const storeSentPayments = (sentPayments: EscrowedPayment[]): StoreSentPaymentsAction => ({
  type: Actions.STORE_SENT_PAYMENTS,
  sentPayments,
})

export const resendPayment = (paymentId: string): ResendPaymentAction => ({
  type: Actions.RESEND_PAYMENT,
  paymentId,
})

export const reclaimPaymentSuccess = (): ReclaimPaymentSuccessAction => ({
  type: Actions.RECLAIM_PAYMENT_SUCCESS,
})

export const reclaimPaymentFailure = (error: ErrorMessages): ReclaimFailureAction => ({
  type: Actions.RECLAIM_PAYMENT_FAILURE,
  error,
})
