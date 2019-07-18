import { PaymentRequestStatuses } from 'src/account/types'
import { RootState } from 'src/redux/reducers'

export const getPaymentRequests = (state: RootState) => {
  return (state.account.paymentRequests || []).filter(
    (p) => p.status === PaymentRequestStatuses.REQUESTED
  )
}
