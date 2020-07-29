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
  comment?: string
  timestamp: Date
  requesterAddress: string
  requesteeAddress: string
  requesterE164Number?: string
  currency: SHORT_CURRENCIES
  status: PaymentRequestStatus
  notified: boolean
  type?: NotificationTypes.PAYMENT_REQUESTED
}
