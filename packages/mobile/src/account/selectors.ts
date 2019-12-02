import { PaymentRequestStatus } from 'src/account/types'
import { RootState } from 'src/redux/reducers'

export const getIncomingPaymentRequests = (state: RootState) => {
  return (state.account.incomingPaymentRequests || []).filter(
    (p) => p.status === PaymentRequestStatus.REQUESTED
  )
}

export const getOutgoingPaymentRequests = (state: RootState) => {
  return (state.account.outgoingPaymentRequests || []).filter(
    (p) => p.status === PaymentRequestStatus.REQUESTED
  )
}
