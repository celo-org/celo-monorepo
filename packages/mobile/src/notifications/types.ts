export enum NotificationTypes {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_REQUESTED = 'PAYMENT_REQUESTED',
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
