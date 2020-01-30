import { PaymentRequest } from 'src/account/types'

export enum Actions {
  AUTHORIZED = 'FIREBASE/AUTHORIZED',
  PAYMENT_REQUEST_DECLINE = 'FIREBASE/PAYMENT_REQUEST_DECLINE',
  PAYMENT_REQUEST_COMPLETE = 'FIREBASE/PAYMENT_REQUEST_COMPLETE',
  PAYMENT_REQUEST_CANCEL = 'FIREBASE/PAYMENT_REQUEST_CANCEL',
  PAYMENT_REQUEST_UPDATE_NOTIFIED = 'FIREBASE/PAYMENT_REQUEST_UPDATE_NOTIFIED',
  PAYMENT_REQUEST_WRITE = 'FIREBASE/PAYMENT_REQUEST_WRITE',
}

export const firebaseAuthorized = () => ({
  type: Actions.AUTHORIZED,
})

export interface DeclinePaymentRequestAction {
  type: Actions.PAYMENT_REQUEST_DECLINE
  id: string
}

export interface CompletePaymentRequestAction {
  type: Actions.PAYMENT_REQUEST_COMPLETE
  id: string
}

export interface CancelPaymentRequestAction {
  type: Actions.PAYMENT_REQUEST_CANCEL
  id: string
}

export interface UpdatePaymentRequestNotifiedAction {
  type: Actions.PAYMENT_REQUEST_UPDATE_NOTIFIED
  id: string
  notified: boolean
}

export interface WritePaymentRequest {
  type: Actions.PAYMENT_REQUEST_WRITE
  paymentInfo: PaymentRequest
}

export const declinePaymentRequest = (id: string): DeclinePaymentRequestAction => ({
  type: Actions.PAYMENT_REQUEST_DECLINE,
  id,
})

export const completePaymentRequest = (id: string): CompletePaymentRequestAction => ({
  type: Actions.PAYMENT_REQUEST_COMPLETE,
  id,
})

export const cancelPaymentRequest = (id: string): CancelPaymentRequestAction => ({
  type: Actions.PAYMENT_REQUEST_CANCEL,
  id,
})

export const updatePaymentRequestNotified = (
  id: string,
  notified: boolean
): UpdatePaymentRequestNotifiedAction => ({
  type: Actions.PAYMENT_REQUEST_UPDATE_NOTIFIED,
  id,
  notified,
})

export const writePaymentRequest = (paymentInfo: PaymentRequest): WritePaymentRequest => ({
  type: Actions.PAYMENT_REQUEST_WRITE,
  paymentInfo,
})
