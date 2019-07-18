import { PaymentRequest, PaymentRequestStatuses } from 'src/account'
import { SHORT_CURRENCIES } from 'src/geth/consts'

export function paymentRequestDouble(partial: object): PaymentRequest {
  return {
    uid: '7363bvby2ba8270273',
    amount: '20',
    comment: 'Just the best',
    requesterE164Number: '+1555-867-5309',
    requesteeAddress: '0x15280126303735b625',
    currency: SHORT_CURRENCIES.DOLLAR,
    timestamp: new Date(),
    requesterAddress: '101929292929',
    status: PaymentRequestStatuses.REQUESTED,
    notified: true,
    ...partial,
  }
}
