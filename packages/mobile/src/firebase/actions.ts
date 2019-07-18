import { PaymentRequestStatuses } from 'src/account'

export enum Actions {
  AUTHORIZED = 'FIREBASE/AUTHORIZED',
  PAYMENT_REQUEST_UPDATE_STATUS = 'FIREBASE/PAYMENT_REQUEST_UPDATE_STATUS',
}

export const firebaseAuthorized = () => ({
  type: Actions.AUTHORIZED,
})

export const updatePaymentRequestStatus = (id: string, status: PaymentRequestStatuses) => ({
  type: Actions.PAYMENT_REQUEST_UPDATE_STATUS,
  id,
  status,
})
