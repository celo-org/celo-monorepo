import { PaymentRequest, PaymentRequestStatus } from 'src/paymentRequest/types'

export enum Actions {
  WRITE_PAYMENT_REQUEST = 'PAYMENT_REQUEST/WRITE_PAYMENT_REQUEST',
  UPDATE_INCOMING_REQUESTS = 'PAYMENT_REQUEST/UPDATE_INCOMING_REQUESTS',
  UPDATE_OUTGOING_REQUESTS = 'PAYMENT_REQUEST/UPDATE_OUTGOING_REQUESTS',
  UPDATE_REQUEST_STATUS = 'PAYMENT_REQUEST/UPDATE_REQUEST_STATUS',
  UPDATE_REQUEST_NOTIFIED = 'PAYMENT_REQUEST/UPDATE_REQUEST_NOTIFIED',
}

export interface WritePaymentRequestAction {
  type: Actions.WRITE_PAYMENT_REQUEST
  paymentRequest: PaymentRequest
}

export const writePaymentRequest = (paymentRequest: PaymentRequest): WritePaymentRequestAction => ({
  type: Actions.WRITE_PAYMENT_REQUEST,
  paymentRequest,
})

export interface UpdateIncomingPaymentRequestsAction {
  type: Actions.UPDATE_INCOMING_REQUESTS
  paymentRequests: PaymentRequest[]
}

export const updateIncomingPaymentRequests = (
  paymentRequests: PaymentRequest[]
): UpdateIncomingPaymentRequestsAction => ({
  type: Actions.UPDATE_INCOMING_REQUESTS,
  paymentRequests,
})

export interface UpdateOutgoingPaymentRequestsAction {
  type: Actions.UPDATE_OUTGOING_REQUESTS
  paymentRequests: PaymentRequest[]
}

export const updateOutgoingPaymentRequests = (
  paymentRequests: PaymentRequest[]
): UpdateOutgoingPaymentRequestsAction => ({
  type: Actions.UPDATE_OUTGOING_REQUESTS,
  paymentRequests,
})

export interface UpdatePaymentRequestNotifiedAction {
  type: Actions.UPDATE_REQUEST_NOTIFIED
  id: string
  notified: boolean
}

export const updatePaymentRequestNotified = (
  id: string,
  notified: boolean
): UpdatePaymentRequestNotifiedAction => ({
  type: Actions.UPDATE_REQUEST_NOTIFIED,
  id,
  notified,
})

export interface CompletePaymentRequestAction {
  type: Actions.UPDATE_REQUEST_STATUS
  status: PaymentRequestStatus.COMPLETED
  id: string
}

export const completePaymentRequest = (id: string): CompletePaymentRequestAction => ({
  type: Actions.UPDATE_REQUEST_STATUS,
  status: PaymentRequestStatus.COMPLETED,
  id,
})

export interface DeclinePaymentRequestAction {
  type: Actions.UPDATE_REQUEST_STATUS
  status: PaymentRequestStatus.DECLINED
  id: string
}

export const declinePaymentRequest = (id: string): DeclinePaymentRequestAction => ({
  type: Actions.UPDATE_REQUEST_STATUS,
  status: PaymentRequestStatus.DECLINED,
  id,
})

export interface CancelPaymentRequestAction {
  type: Actions.UPDATE_REQUEST_STATUS
  status: PaymentRequestStatus.CANCELLED
  id: string
}

export const cancelPaymentRequest = (id: string): CancelPaymentRequestAction => ({
  type: Actions.UPDATE_REQUEST_STATUS,
  status: PaymentRequestStatus.CANCELLED,
  id,
})

export type ActionTypes = UpdateIncomingPaymentRequestsAction | UpdateOutgoingPaymentRequestsAction
