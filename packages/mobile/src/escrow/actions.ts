import BigNumber from 'bignumber.js'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { SHORT_CURRENCIES } from 'src/geth/consts'

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
}

export interface EscrowTransferPaymentAction {
  type: Actions.TRANSFER_PAYMENT
  phoneHash: string
  amount: BigNumber
  tempWalletAddress: string
  txId: string
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
  error: ErrorMessages
}

export type ActionTypes =
  | EscrowTransferPaymentAction
  | EscrowReclaimPaymentAction
  | EscrowFetchSentPaymentsAction
  | EscrowStoreSentPaymentsAction
  | EscrowResendPaymentAction
  | EscrowReclaimPaymentSuccessAction
  | EscrowReclaimFailureAction

export const transferEscrowedPayment = (
  phoneHash: string,
  amount: BigNumber,
  tempWalletAddress: string,
  txId: string
): EscrowTransferPaymentAction => ({
  type: Actions.TRANSFER_PAYMENT,
  phoneHash,
  amount,
  tempWalletAddress,
  txId,
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

export const reclaimEscrowPaymentFailure = (error: ErrorMessages): EscrowReclaimFailureAction => ({
  type: Actions.RECLAIM_PAYMENT_FAILURE,
  error,
})
