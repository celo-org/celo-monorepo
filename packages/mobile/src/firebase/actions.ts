import { PaymentRequestStatus } from 'src/account'

export enum Actions {
  AUTHORIZED = 'FIREBASE/AUTHORIZED',
  PAYMENT_REQUEST_UPDATE_STATUS = 'FIREBASE/PAYMENT_REQUEST_UPDATE_STATUS',
}

export const firebaseAuthorized = () => ({
  type: Actions.AUTHORIZED,
})

export interface UpdatePaymentRequestStatusAction {
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS
  id: string
  status: PaymentRequestStatus
}

export const updatePaymentRequestStatus = (
  id: string,
  status: PaymentRequestStatus
): UpdatePaymentRequestStatusAction => ({
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS,
  id,
  status,
})
