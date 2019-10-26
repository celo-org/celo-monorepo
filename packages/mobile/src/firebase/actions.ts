import { PaymentRequest, PaymentRequestStatus } from 'src/account'

export enum Actions {
  AUTHORIZED = 'FIREBASE/AUTHORIZED',
  PAYMENT_REQUEST_UPDATE_STATUS = 'FIREBASE/PAYMENT_REQUEST_UPDATE_STATUS',
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

export const writePaymentRequest = (paymentInfo: PaymentRequest): WritePaymentRequest => ({
  type: Actions.PAYMENT_REQUEST_WRITE,
  paymentInfo,
})
