export const SENTINEL_INVITE_COMMENT = '__CELO_INVITE_TX__'
import BigNumber from 'bignumber.js'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { FeeInfo } from 'src/fees/saga'
import { CURRENCY_ENUM } from 'src/geth/consts'

export enum Actions {
  STORE_INVITEE_DATA = 'INVITE/STORE_INVITEE_DATA',
  SEND_INVITE = 'INVITE/SEND_INVITE',
  SEND_INVITE_SUCCESS = 'INVITE/SEND_INVITE_SUCCESS',
  SEND_INVITE_FAILURE = 'INVITE/SEND_INVITE_FAILURE',
  REDEEM_INVITE = 'INVITE/REDEEM_INVITE',
  REDEEM_INVITE_SUCCESS = 'INVITE/REDEEM_INVITE_SUCCESS',
  REDEEM_INVITE_FAILURE = 'INVITE/REDEEM_INVITE_FAILURE',
}

export interface InviteDetails {
  timestamp: number
  e164Number: string
  tempWalletAddress: string
  tempWalletPrivateKey: string
  tempWalletRedeemed: boolean
  inviteCode: string
  inviteLink: string
}

export enum InviteBy {
  WhatsApp = 'WhatsApp',
  SMS = 'SMS',
}

export interface StoreInviteeDataAction {
  type: Actions.STORE_INVITEE_DATA
  inviteDetails: InviteDetails
}

export const storeInviteeData = (inviteDetails: InviteDetails): StoreInviteeDataAction => ({
  type: Actions.STORE_INVITEE_DATA,
  inviteDetails,
})

export interface SendInviteAction {
  type: Actions.SEND_INVITE
  e164Number: string
  inviteMode: InviteBy
  amount?: BigNumber
  currency?: CURRENCY_ENUM
  feeInfo?: FeeInfo
}

export const sendInvite = (
  e164Number: string,
  inviteMode: InviteBy,
  amount?: BigNumber,
  currency?: CURRENCY_ENUM,
  feeInfo?: FeeInfo
): SendInviteAction => ({
  type: Actions.SEND_INVITE,
  e164Number,
  inviteMode,
  amount,
  currency,
  feeInfo,
})

export interface SendInviteSuccessAction {
  type: Actions.SEND_INVITE_SUCCESS
}

export const sendInviteSuccess = (): SendInviteSuccessAction => ({
  type: Actions.SEND_INVITE_SUCCESS,
})

export interface SendInviteFailureAction {
  type: Actions.SEND_INVITE_FAILURE
  error: ErrorMessages
}

export const sendInviteFailure = (error: ErrorMessages): SendInviteFailureAction => ({
  type: Actions.SEND_INVITE_FAILURE,
  error,
})

export interface RedeemInviteAction {
  type: Actions.REDEEM_INVITE
  tempAccountPrivateKey: string
}

export const redeemInvite = (tempAccountPrivateKey: string): RedeemInviteAction => ({
  type: Actions.REDEEM_INVITE,
  tempAccountPrivateKey,
})

export interface RedeemInviteSuccessAction {
  type: Actions.REDEEM_INVITE_SUCCESS
}

export const redeemInviteSuccess = (): RedeemInviteSuccessAction => ({
  type: Actions.REDEEM_INVITE_SUCCESS,
})

export interface RedeemInviteFailureAction {
  type: Actions.REDEEM_INVITE_FAILURE
}

export const redeemInviteFailure = (): RedeemInviteFailureAction => ({
  type: Actions.REDEEM_INVITE_FAILURE,
})

export type ActionTypes =
  | StoreInviteeDataAction
  | SendInviteAction
  | RedeemInviteAction
  | RedeemInviteSuccessAction
  | RedeemInviteFailureAction
  | SendInviteFailureAction
  | SendInviteSuccessAction
