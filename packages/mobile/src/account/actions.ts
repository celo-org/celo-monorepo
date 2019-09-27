import { PincodeType } from 'src/account/reducer'
import { PaymentRequest } from 'src/account/types'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'

export enum Actions {
  SET_NAME = 'ACCOUNT/SET_NAME',
  SET_PHONE_NUMBER = 'ACCOUNT/SET_PHONE_NUMBER',
  DEV_MODE_TRIGGER_CLICKED = 'ACCOUNT/NAME_CLICKED',
  PHOTOSNUX_CLICKED = 'ACCOUNT/PHOTOSNUX_CLICKED',
  SET_PINCODE = 'ACCOUNT/SET_PINCODE',
  SET_PINCODE_SUCCESS = 'ACCOUNT/SET_PINCODE_SUCCESS',
  SET_PINCODE_FAILURE = 'ACCOUNT/SET_PINCODE_FAILURE',
  SET_ACCOUNT_CREATION_TIME_ACTION = 'ACCOUNT/SET_ACCOUNT_CREATION_TIME_ACTION',
  SET_BACKUP_COMPLETED_ACTION = 'ACCOUNT/SET_BACKUP_COMPLETED_ACTION',
  SET_BACKUP_DELAYED_ACTION = 'ACCOUNT/SET_BACKUP_DELAYED_ACTION',
  UPDATE_PAYMENT_REQUESTS = 'ACCOUNT/UPDATE_PAYMENT_REQUESTS',
  DISMISS_EARN_REWARDS = 'ACCOUNT/DISMISS_EARN_REWARDS',
  DISMISS_INVITE_FRIENDS = 'ACCOUNT/DISMISS_INVITE_FRIENDS',
  SET_USER_CONTACT_DETAILS = 'ACCOUNT/SET_USER_CONTACT_DETAILS',
}

export interface SetNameAction {
  type: Actions.SET_NAME
  name: string
}

export interface SetPhoneNumberAction {
  type: Actions.SET_PHONE_NUMBER
  e164PhoneNumber: string
  countryCode: string
}

export interface DevModeTriggerClickedAction {
  type: Actions.DEV_MODE_TRIGGER_CLICKED
}

export interface PhotosNUXClickedAction {
  type: Actions.PHOTOSNUX_CLICKED
}

export interface SetPincodeAction {
  type: Actions.SET_PINCODE
  pincodeType: PincodeType
  pin?: string
}

export interface SetPincodeSuccessAction {
  type: Actions.SET_PINCODE_SUCCESS
  pincodeType: PincodeType
}

export interface SetPincodeFailureAction {
  type: Actions.SET_PINCODE_FAILURE
}

export interface SetAccountCreationAction {
  type: Actions.SET_ACCOUNT_CREATION_TIME_ACTION
}

export interface SetBackupCompletedAction {
  type: Actions.SET_BACKUP_COMPLETED_ACTION
}

export interface SetBackupDelayedAction {
  type: Actions.SET_BACKUP_DELAYED_ACTION
}

export interface UpdatePaymentRequestsAction {
  type: Actions.UPDATE_PAYMENT_REQUESTS
  paymentRequests: PaymentRequest[]
}

export interface DismissEarnRewards {
  type: Actions.DISMISS_EARN_REWARDS
}

export interface DismissInviteFriends {
  type: Actions.DISMISS_INVITE_FRIENDS
}

export interface SetContactDetailsAction {
  type: Actions.SET_USER_CONTACT_DETAILS
  contactId: string
  thumbnailPath: string | null
}

export type ActionTypes =
  | SetNameAction
  | SetPhoneNumberAction
  | DevModeTriggerClickedAction
  | PhotosNUXClickedAction
  | SetPincodeAction
  | SetPincodeSuccessAction
  | SetPincodeFailureAction
  | SetAccountCreationAction
  | SetBackupCompletedAction
  | SetBackupDelayedAction
  | UpdatePaymentRequestsAction
  | DismissEarnRewards
  | DismissInviteFriends
  | SetContactDetailsAction

export function setName(name: string): SetNameAction {
  return {
    type: Actions.SET_NAME,
    name,
  }
}

export function setPhoneNumber(e164PhoneNumber: string, countryCode: string): SetPhoneNumberAction {
  CeloAnalytics.track(DefaultEventNames.phoneNumberSet, { countryCode })
  return {
    type: Actions.SET_PHONE_NUMBER,
    e164PhoneNumber,
    countryCode,
  }
}

export const devModeTriggerClicked = (): DevModeTriggerClickedAction => ({
  type: Actions.DEV_MODE_TRIGGER_CLICKED,
})

export const photosNUXCompleted = (): PhotosNUXClickedAction => ({
  type: Actions.PHOTOSNUX_CLICKED,
})

export const setPincode = (pincodeType: PincodeType, pin?: string): SetPincodeAction => ({
  type: Actions.SET_PINCODE,
  pincodeType,
  pin,
})

export const setPincodeSuccess = (pincodeType: PincodeType): SetPincodeSuccessAction => ({
  type: Actions.SET_PINCODE_SUCCESS,
  pincodeType,
})

export const setPincodeFailure = (): SetPincodeFailureAction => ({
  type: Actions.SET_PINCODE_FAILURE,
})

export const setAccountCreationTime = (): SetAccountCreationAction => ({
  type: Actions.SET_ACCOUNT_CREATION_TIME_ACTION,
})

export const setBackupCompleted = (): SetBackupCompletedAction => ({
  type: Actions.SET_BACKUP_COMPLETED_ACTION,
})

export const setBackupDelayed = (): SetBackupDelayedAction => ({
  type: Actions.SET_BACKUP_DELAYED_ACTION,
})

export const updatePaymentRequests = (
  paymentRequests: PaymentRequest[]
): UpdatePaymentRequestsAction => ({
  type: Actions.UPDATE_PAYMENT_REQUESTS,
  paymentRequests,
})

export const dismissEarnRewards = (): DismissEarnRewards => ({
  type: Actions.DISMISS_EARN_REWARDS,
})

export const dismissInviteFriends = (): DismissInviteFriends => ({
  type: Actions.DISMISS_INVITE_FRIENDS,
})

export const setUserContactDetails = (
  contactId: string,
  thumbnailPath: string | null
): SetContactDetailsAction => ({
  type: Actions.SET_USER_CONTACT_DETAILS,
  contactId,
  thumbnailPath,
})
