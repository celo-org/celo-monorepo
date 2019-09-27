import { SHORT_CURRENCIES } from 'src/geth/consts'

export enum NotificationTypes {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_REQUESTED = 'PAYMENT_REQUESTED',
}

export enum PaymentRequestStatuses {
  REQUESTED = 'REQUESTED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
}

// TODO(Rossy) Find a better home for this
export interface PaymentRequest {
  uid?: string
  amount: string
  timestamp: Date
  requesterAddress: string
  requesterE164Number: string
  requesteeAddress: string
  currency: SHORT_CURRENCIES
  comment: string
  status: PaymentRequestStatuses
  notified: boolean
  type?: NotificationTypes.PAYMENT_REQUESTED
}

export interface TransferNotificationData {
  recipient: string
  sender: string
  value: string
  blockNumber: string
  txHash: string
  timestamp: string
  comment: string
  currency: string
  type?: NotificationTypes.PAYMENT_RECEIVED
}

export enum NotificationReceiveState {
  APP_ALREADY_OPEN,
  APP_FOREGROUNDED,
  APP_OPENED_FRESH,
}
