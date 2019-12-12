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

export interface UpdatePaymentRequestStatusAction {
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS
  id: string
  status: PaymentRequestStatus
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

export const updatePaymentRequestStatus = (
  id: string,
  status: PaymentRequestStatus
): UpdatePaymentRequestStatusAction => ({
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS,
  id,
  status,
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
