import { Channel } from 'redux-saga'
import { PaymentRequestStatus } from 'src/account'

export enum Actions {
  AUTHORIZED = 'FIREBASE/AUTHORIZED',
  PAYMENT_REQUEST_UPDATE_STATUS = 'FIREBASE/PAYMENT_REQUEST_UPDATE_STATUS',
  START_FIREBASE_ON_REFRESH = 'FIREBASE/START_FIREBASE_ON_REFRESH',
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

export interface StartFirebaseOnRefreshAction {
  type: Actions.START_FIREBASE_ON_REFRESH
  channel: Channel<any>
}

export const startFirebaseOnRefreshAction = (
  channel: Channel<any>
): StartFirebaseOnRefreshAction => ({
  type: Actions.START_FIREBASE_ON_REFRESH,
  channel,
})
