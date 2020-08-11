import { PaymentRequestStatus } from 'src/paymentRequest/types'
import { RootState } from 'src/redux/reducers'

export const getIncomingPaymentRequests = (state: RootState) => {
  return (state.paymentRequest.incomingPaymentRequests || []).filter(
    (p) => p.status === PaymentRequestStatus.REQUESTED
  )
}

export const getOutgoingPaymentRequests = (state: RootState) => {
  return (state.paymentRequest.outgoingPaymentRequests || []).filter(
    (p) => p.status === PaymentRequestStatus.REQUESTED
  )
}
