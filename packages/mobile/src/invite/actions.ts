export const SENTINEL_INVITE_COMMENT = '__CELO_INVITE_TX__'
import BigNumber from 'bignumber.js'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CURRENCY_ENUM } from 'src/geth/consts'

export enum Actions {
  STORE_INVITEE_DATA = 'INVITE/STORE_INVITEE_DATA',
  SEND_INVITE = 'INVITE/SEND_INVITE',
  SEND_INVITE_SUCCESS = 'INVITE/SEND_INVITE_SUCCESS',
  SEND_INVITE_FAILURE = 'INVITE/SEND_INVITE_FAILURE',
  REDEEM_INVITE = 'INVITE/REDEEM_INVITE',
  STORE_REDEEMED_INVITE_CODE = 'STORE_REDEEMED_INVITE_CODE',
  REDEEM_INVITE_SUCCESS = 'INVITE/REDEEM_INVITE_SUCCESS',
  REDEEM_INVITE_FAILURE = 'INVITE/REDEEM_INVITE_FAILURE',
}

export interface Invitees {
  [tempAddress: string]: string // tempAddress -> e164Number
}

export enum InviteBy {
  WhatsApp = 'WhatsApp',
  SMS = 'SMS',
}

export interface StoreInviteeDataAction {
  type: Actions.STORE_INVITEE_DATA
  address: string
  e164Number: string
}

export const storeInviteeData = (address: string, e164Number: string): StoreInviteeDataAction => ({
  type: Actions.STORE_INVITEE_DATA,
  address,
  e164Number,
})

export interface SendInviteAction {
  type: Actions.SEND_INVITE
  recipientName: string
  e164Number: string
  inviteMode: InviteBy
  amount?: BigNumber
  currency?: CURRENCY_ENUM
}

export const sendInvite = (
  recipientName: string,
  e164Number: string,
  inviteMode: InviteBy,
  amount?: BigNumber,
  currency?: CURRENCY_ENUM
): SendInviteAction => ({
  type: Actions.SEND_INVITE,
  recipientName,
  e164Number,
  inviteMode,
  amount,
  currency,
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
  inviteCode: string
}

export const redeemInvite = (inviteCode: string): RedeemInviteAction => ({
  type: Actions.REDEEM_INVITE,
  inviteCode,
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
