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
  VALIDATE_RECIPIENT_ADDRESS = 'SEND/VALIDATE_RECIPIENT_ADDRESS',
  VALIDATE_RECIPIENT_ADDRESS_SUCCESS = 'SEND/VALIDATE_RECIPIENT_ADDRESS_SUCCESS',
  VALIDATE_RECIPIENT_ADDRESS_FAILURE = 'SEND/VALIDATE_RECIPIENT_ADDRESS_FAILURE',
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
  firebasePendingRequestUid: string | null | undefined
}

export interface SendPaymentOrInviteSuccessAction {
  type: Actions.SEND_PAYMENT_OR_INVITE_SUCCESS
}

export interface SendPaymentOrInviteFailureAction {
  type: Actions.SEND_PAYMENT_OR_INVITE_FAILURE
}

export interface ValidateRecipientAddressAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS
  fullAddressOrLastFourDigits: string
  fullAddressValidationRequired: boolean
}

export interface ValidateRecipientAddressSuccessAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS
}

export interface ValidateRecipientAddressFailureAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_FAILURE
}

export type ActionTypes =
  | StoreLatestInRecentsAction
  | SendPaymentOrInviteAction
  | SendPaymentOrInviteSuccessAction
  | SendPaymentOrInviteFailureAction
  | ValidateRecipientAddressAction
  | ValidateRecipientAddressSuccessAction
  | ValidateRecipientAddressFailureAction

export const storeLatestInRecents = (recipient: Recipient): StoreLatestInRecentsAction => ({
  type: Actions.STORE_LATEST_IN_RECENTS,
  recipient,
})

export const handleBarcodeDetected = (data: QrCode, isScanForSecureSend?: boolean) => ({
  type: Actions.BARCODE_DETECTED,
  data,
  isScanForSecureSend,
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
  firebasePendingRequestUid: string | null | undefined
): SendPaymentOrInviteAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE,
  amount,
  reason,
  recipient,
  recipientAddress,
  inviteMethod,
  firebasePendingRequestUid,
})

export const sendPaymentOrInviteSuccess = (): SendPaymentOrInviteSuccessAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE_SUCCESS,
})

export const sendPaymentOrInviteFailure = (): SendPaymentOrInviteFailureAction => ({
  type: Actions.SEND_PAYMENT_OR_INVITE_FAILURE,
})

export const validateRecipientAddress = (
  fullAddressOrLastFourDigits: string,
  fullAddressValidationRequired: boolean
): ValidateRecipientAddressAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS,
  fullAddressOrLastFourDigits,
  fullAddressValidationRequired,
})

export const validateRecipientAddressSuccess = (): ValidateRecipientAddressSuccessAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS,
})

export const validateRecipientAddressFailure = (): ValidateRecipientAddressFailureAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_FAILURE,
})
