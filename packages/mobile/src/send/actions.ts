import BigNumber from 'bignumber.js'
import { InviteBy } from 'src/invite/actions'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { DispatchType, GetStateType } from 'src/redux/reducers'
import { BasicTokenTransfer, createTransaction } from 'src/tokens/saga'
import Logger from 'src/utils/Logger'
import { NumberToRecipient, Recipient } from 'src/utils/recipient'
import { web3 } from 'src/web3/contracts'
import { fetchGasPrice } from 'src/web3/gas'
import { currentAccountSelector } from 'src/web3/selectors'
import { Svg } from 'svgs'

const TAG = 'send/actions'

export interface QrCode {
  type: string
  data: string
}

export type SVG = typeof Svg

export enum Actions {
  SET_TRANSACTION_FEE = 'SEND/SET_TRANSACTION_FEE',
  STORE_PHONE_NUMBER_IN_RECENTS = 'SEND/STORE_PHONE_NUMBER_IN_RECENTS',
  BARCODE_DETECTED = 'SEND/BARCODE_DETECTED',
  QRCODE_SHARE = 'SEND/QRCODE_SHARE',
  SET_RECIPIENT_CACHE = 'SEND/SET_RECIPIENT_CACHE',
  SEND_TO_UNVERIFIED = 'SEND/SEND_TO_UNVERIFIED',
  SEND_PAYMENT_OR_INVITE = 'SEND/SEND_PAYMENT_OR_INVITE',
  SEND_PAYMENT_OR_INVITE_SUCCESS = 'SEND/SEND_PAYMENT_OR_INVITE_SUCCESS',
  SEND_PAYMENT_OR_INVITE_FAILURE = 'SEND/SEND_PAYMENT_OR_INVITE_FAILURE',
}

export interface SetTransactionFeeAction {
  type: Actions.SET_TRANSACTION_FEE
  suggestedFee: string
}

export interface StorePhoneNumberInRecentsAction {
  type: Actions.STORE_PHONE_NUMBER_IN_RECENTS
  phoneNumber: string
}

export interface SetRecipientCacheAction {
  type: Actions.SET_RECIPIENT_CACHE
  recipients: NumberToRecipient
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
  | SetTransactionFeeAction
  | StorePhoneNumberInRecentsAction
  | SetRecipientCacheAction
  | SendPaymentOrInviteAction
  | SendPaymentOrInviteSuccessAction
  | SendPaymentOrInviteFailureAction

export const setTransactionFee = (suggestedFee: string): SetTransactionFeeAction => ({
  type: Actions.SET_TRANSACTION_FEE,
  suggestedFee,
})

export const storePhoneNumberInRecents = (
  phoneNumber: string
): StorePhoneNumberInRecentsAction => ({
  type: Actions.STORE_PHONE_NUMBER_IN_RECENTS,
  phoneNumber,
})

export const handleBarcodeDetected = (data: QrCode) => ({
  type: Actions.BARCODE_DETECTED,
  data,
})

export const shareQRCode = (qrCodeSvg: SVG) => ({
  type: Actions.QRCODE_SHARE,
  qrCodeSvg,
})

export const setRecipientCache = (recipients: NumberToRecipient): SetRecipientCacheAction => ({
  type: Actions.SET_RECIPIENT_CACHE,
  recipients,
})

export const updateSuggestedFee = (
  contactIsVerified: boolean,
  contractGetter: any,
  params: BasicTokenTransfer
) => async (dispatch: DispatchType, getState: GetStateType) => {
  try {
    if (contactIsVerified) {
      // create mock transaction and get gas

      const tx = await createTransaction(contractGetter, params)
      const account = currentAccountSelector(getState())

      const txParams: any = { from: account, gasCurrency: contractGetter(web3)._address }
      const gas: BigNumber = new BigNumber(await tx.estimateGas(txParams))
      const gasPrice: BigNumber = new BigNumber(await fetchGasPrice())

      Logger.debug(`${TAG}/updateSuggestedFee`, `estimated gas: ${gas}`)
      Logger.debug(`${TAG}/updateSuggestedFee`, `gas price: ${gasPrice}`)

      const suggestedFeeInWei: BigNumber = gas.multipliedBy(gasPrice)

      dispatch(setTransactionFee(suggestedFeeInWei.toString()))
      Logger.debug(`${TAG}/updateSuggestedFee`, `New fee is: ${suggestedFeeInWei}`)
      return suggestedFeeInWei
    } else {
      // invitation
      // TODO add verification fee + transfer costs + Escrow
      const verificationFee = await getInvitationVerificationFee()
      dispatch(setTransactionFee(String(verificationFee.valueOf())))
      return verificationFee
    }
  } catch (error) {
    Logger.error(`${TAG}/updateSuggestedFee`, 'Could not update suggested fee', error)
    throw error
  }
}

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
