import { PaymentRequest, PaymentRequestStatus } from 'src/account/types'

export enum Actions {
  AUTHORIZED = 'FIREBASE/AUTHORIZED',
  PAYMENT_REQUEST_UPDATE_STATUS = 'FIREBASE/PAYMENT_REQUEST_UPDATE_STATUS',
  PAYMENT_REQUEST_UPDATE_NOTIFIED = 'FIREBASE/PAYMENT_REQUEST_UPDATE_NOTIFIED',
  PAYMENT_REQUEST_WRITE = 'FIREBASE/PAYMENT_REQUEST_WRITE',
}

export const firebaseAuthorized = () => ({
  type: Actions.AUTHORIZED,
})

export interface DeclinePaymentRequestAction {
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS
  status: PaymentRequestStatus.DECLINED
  id: string
}

export interface CompletePaymentRequestAction {
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS
  status: PaymentRequestStatus.COMPLETED
  id: string
}

export interface CancelPaymentRequestAction {
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS
  status: PaymentRequestStatus.CANCELLED
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
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS,
  status: PaymentRequestStatus.DECLINED,
  id,
})

export const completePaymentRequest = (id: string): CompletePaymentRequestAction => ({
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS,
  status: PaymentRequestStatus.COMPLETED,
  id,
})

export const cancelPaymentRequest = (id: string): CancelPaymentRequestAction => ({
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS,
  status: PaymentRequestStatus.CANCELLED,
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
