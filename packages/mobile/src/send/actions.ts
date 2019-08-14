import BigNumber from 'bignumber.js'
import { InviteBy } from 'src/invite/actions'
import { Recipient } from 'src/recipients/recipient'
import { Svg } from 'svgs'

export interface QrCode {
  type: string
  data: string
}

export type SVG = typeof Svg

export enum Actions {
  STORE_LATEST_IN_RECENTS = 'SEND/STORE_LATEST_IN_RECENTS',
  BARCODE_DETECTED = 'SEND/BARCODE_DETECTED',
  QRCODE_SHARE = 'SEND/QRCODE_SHARE',
  SEND_PAYMENT_OR_INVITE = 'SEND/SEND_PAYMENT_OR_INVITE',
  SEND_PAYMENT_OR_INVITE_SUCCESS = 'SEND/SEND_PAYMENT_OR_INVITE_SUCCESS',
  SEND_PAYMENT_OR_INVITE_FAILURE = 'SEND/SEND_PAYMENT_OR_INVITE_FAILURE',
}

export interface StoreLatestInRecentsAction {
  type: Actions.STORE_LATEST_IN_RECENTS
  recipient: Recipient
}

export interface SendPaymentOrInviteAction {
  type: Actions.SEND_PAYMENT_OR_INVITE
  amount: BigNumber
  reason: string
  recipient: Recipient
  recipientAddress?: string | null
  inviteMethod?: InviteBy
  onConfirm: () => void
}

export interface SendPaymentOrInviteSuccessAction {
  type: Actions.SEND_PAYMENT_OR_INVITE_SUCCESS
}

export interface SendPaymentOrInviteFailureAction {
  type: Actions.SEND_PAYMENT_OR_INVITE_FAILURE
}

export type ActionTypes =
  | StoreLatestInRecentsAction
  | SendPaymentOrInviteAction
  | SendPaymentOrInviteSuccessAction
  | SendPaymentOrInviteFailureAction

export const storeLatestInRecents = (recipient: Recipient): StoreLatestInRecentsAction => ({
  type: Actions.STORE_LATEST_IN_RECENTS,
  recipient,
})

export const handleBarcodeDetected = (data: QrCode) => ({
  type: Actions.BARCODE_DETECTED,
  data,
})

export const shareQRCode = (qrCodeSvg: SVG) => ({
  type: Actions.QRCODE_SHARE,
  qrCodeSvg,
})

export const sendPaymentOrInvite = (
  amount: BigNumber,
  reason: string,
  recipient: Recipient,
  recipientAddress: string | null | undefined,
  inviteMethod: InviteBy | undefined,
  onConfirm: () => void
): SendPaymentOrInviteAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE,
  amount,
  reason,
  recipient,
  recipientAddress,
  inviteMethod,
  onConfirm,
})

export const sendPaymentOrInviteSuccess = (): SendPaymentOrInviteSuccessAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE_SUCCESS,
})

export const sendPaymentOrInviteFailure = (): SendPaymentOrInviteFailureAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE_FAILURE,
})
