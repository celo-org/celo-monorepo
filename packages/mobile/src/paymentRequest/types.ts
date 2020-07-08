import { SHORT_CURRENCIES } from 'src/geth/consts'
import { NotificationTypes } from 'src/notifications/types'

export enum PaymentRequestStatus {
  REQUESTED = 'REQUESTED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}

export interface PaymentRequest {
  uid?: string
  amount: string
  timestamp: Date
  requesterAddress: string
  requesteeAddress: string
  currency: SHORT_CURRENCIES
  // TODO find a way to enable comment encryption here
  comment: string
  status: PaymentRequestStatus
  notified: boolean
  type?: NotificationTypes.PAYMENT_REQUESTED
}
