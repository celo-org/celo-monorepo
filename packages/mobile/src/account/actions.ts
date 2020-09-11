import { PincodeType } from 'src/account/reducer'

export enum Actions {
  CHOOSE_CREATE_ACCOUNT = 'ACCOUNT/CHOOSE_CREATE',
  CHOOSE_RESTORE_ACCOUNT = 'ACCOUNT/CHOOSE_RESTORE',
  CANCEL_CREATE_OR_RESTORE_ACCOUNT = 'ACCOUNT/CANCEL_CREATE_OR_RESTORE_ACCOUNT',
  SET_NAME = 'ACCOUNT/SET_NAME',
  SET_PHONE_NUMBER = 'ACCOUNT/SET_PHONE_NUMBER',
  DEV_MODE_TRIGGER_CLICKED = 'ACCOUNT/NAME_CLICKED',
  PHOTOSNUX_CLICKED = 'ACCOUNT/PHOTOSNUX_CLICKED',
  SET_PINCODE = 'ACCOUNT/SET_PINCODE',
  SET_PINCODE_SUCCESS = 'ACCOUNT/SET_PINCODE_SUCCESS',
  SET_PINCODE_FAILURE = 'ACCOUNT/SET_PINCODE_FAILURE',
  SET_ACCOUNT_CREATION_TIME = 'ACCOUNT/SET_ACCOUNT_CREATION_TIME',
  SET_BACKUP_COMPLETED = 'ACCOUNT/SET_BACKUP_COMPLETED',
  SET_BACKUP_DELAYED = 'ACCOUNT/SET_BACKUP_DELAYED',
  SET_SOCIAL_BACKUP_COMPLETED = 'ACCOUNT/SET_SOCIAL_BACKUP_COMPLETED',
  TOGGLE_BACKUP_STATE = 'ACCOUNT/TOGGLE_BACKUP_STATE',
  DISMISS_INVITE_FRIENDS = 'ACCOUNT/DISMISS_INVITE_FRIENDS',
  DISMISS_GET_VERIFIED = 'ACCOUNT/DISMISS_GET_VERIFIED',
  DISMISS_GOLD_EDUCATION = 'ACCOUNT/DISMISS_GOLD_EDUCATION',
  SET_USER_CONTACT_DETAILS = 'ACCOUNT/SET_USER_CONTACT_DETAILS',
  SET_PROMPT_FORNO = 'ACCOUNT/SET_PROMPT_FORNO',
  SET_RETRY_VERIFICATION_WITH_FORNO = 'ACCOUNT/SET_RETRY_VERIFICATION_WITH_FORNO',
  ACCEPT_TERMS = 'ACCOUNT/ACCEPT_TERMS',
  MIGRATE_ACCOUNT_BIP39 = 'MIGRATE_ACCOUNT_BIP39',
  CLEAR_STORED_ACCOUNT = 'ACCOUNT/CLEAR_STORED_ACCOUNT',
}

export interface ChooseCreateAccountAction {
  type: Actions.CHOOSE_CREATE_ACCOUNT
}
export interface ChooseRestoreAccountAction {
  type: Actions.CHOOSE_RESTORE_ACCOUNT
}

export interface CancelCreateOrRestoreAccountAction {
  type: Actions.CANCEL_CREATE_OR_RESTORE_ACCOUNT
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

export interface AcceptTermsAction {
  type: Actions.ACCEPT_TERMS
}

export interface PhotosNUXClickedAction {
  type: Actions.PHOTOSNUX_CLICKED
}

export interface SetPincodeAction {
  type: Actions.SET_PINCODE
  pincodeType: PincodeType
}

export interface SetPincodeSuccessAction {
  type: Actions.SET_PINCODE_SUCCESS
  pincodeType: PincodeType
}

export interface SetPincodeFailureAction {
  type: Actions.SET_PINCODE_FAILURE
}

export interface SetAccountCreationAction {
  type: Actions.SET_ACCOUNT_CREATION_TIME
}

export interface SetBackupCompletedAction {
  type: Actions.SET_BACKUP_COMPLETED
}

export interface SetBackupDelayedAction {
  type: Actions.SET_BACKUP_DELAYED
}

export interface SetSocialBackupCompletedAction {
  type: Actions.SET_SOCIAL_BACKUP_COMPLETED
}

export interface ToggleBackupState {
  type: Actions.TOGGLE_BACKUP_STATE
}

export interface DismissInviteFriendsAction {
  type: Actions.DISMISS_INVITE_FRIENDS
}

export interface DismissGetVerifiedAction {
  type: Actions.DISMISS_GET_VERIFIED
}

export interface DismissGoldEducationAction {
  type: Actions.DISMISS_GOLD_EDUCATION
}

export interface SetContactDetailsAction {
  type: Actions.SET_USER_CONTACT_DETAILS
  contactId: string
  thumbnailPath: string | null
}

interface SetPromptFornoAction {
  type: Actions.SET_PROMPT_FORNO
  promptIfNeeded: boolean
}

export interface SetRetryVerificationWithFornoAction {
  type: Actions.SET_RETRY_VERIFICATION_WITH_FORNO
  retry: boolean
}

export interface MigrateAccount {
  type: Actions.MIGRATE_ACCOUNT_BIP39
}

export interface ClearStoredAccountAction {
  type: Actions.CLEAR_STORED_ACCOUNT
  account: string
}

export type ActionTypes =
  | ChooseCreateAccountAction
  | ChooseRestoreAccountAction
  | CancelCreateOrRestoreAccountAction
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
  | SetSocialBackupCompletedAction
  | ToggleBackupState
  | DismissInviteFriendsAction
  | DismissGetVerifiedAction
  | DismissGoldEducationAction
  | SetContactDetailsAction
  | SetPromptFornoAction
  | SetRetryVerificationWithFornoAction
  | AcceptTermsAction
  | MigrateAccount
  | ClearStoredAccountAction

export function chooseCreateAccount(): ChooseCreateAccountAction {
  return {
    type: Actions.CHOOSE_CREATE_ACCOUNT,
  }
}

export function chooseRestoreAccount(): ChooseRestoreAccountAction {
  return {
    type: Actions.CHOOSE_RESTORE_ACCOUNT,
  }
}

export function cancelCreateOrRestoreAccount(): CancelCreateOrRestoreAccountAction {
  return {
    type: Actions.CANCEL_CREATE_OR_RESTORE_ACCOUNT,
  }
}

export function setName(name: string): SetNameAction {
  return {
    type: Actions.SET_NAME,
    name,
  }
}
export function acceptTerms(): AcceptTermsAction {
  return {
    type: Actions.ACCEPT_TERMS,
  }
}

export function setPhoneNumber(e164PhoneNumber: string, countryCode: string): SetPhoneNumberAction {
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

export const setPincode = (pincodeType: PincodeType): SetPincodeAction => ({
  type: Actions.SET_PINCODE,
  pincodeType,
})

export const setPincodeSuccess = (pincodeType: PincodeType): SetPincodeSuccessAction => ({
  type: Actions.SET_PINCODE_SUCCESS,
  pincodeType,
})

export const setPincodeFailure = (): SetPincodeFailureAction => ({
  type: Actions.SET_PINCODE_FAILURE,
})

export const setAccountCreationTime = (): SetAccountCreationAction => ({
  type: Actions.SET_ACCOUNT_CREATION_TIME,
})

export const setBackupCompleted = (): SetBackupCompletedAction => ({
  type: Actions.SET_BACKUP_COMPLETED,
})

export const setBackupDelayed = (): SetBackupDelayedAction => ({
  type: Actions.SET_BACKUP_DELAYED,
})

export const setSocialBackupCompleted = (): SetSocialBackupCompletedAction => ({
  type: Actions.SET_SOCIAL_BACKUP_COMPLETED,
})

export const toggleBackupState = (): ToggleBackupState => ({
  type: Actions.TOGGLE_BACKUP_STATE,
})

export const dismissInviteFriends = (): DismissInviteFriendsAction => ({
  type: Actions.DISMISS_INVITE_FRIENDS,
})

export const dismissGetVerified = (): DismissGetVerifiedAction => ({
  type: Actions.DISMISS_GET_VERIFIED,
})

export const dismissGoldEducation = (): DismissGoldEducationAction => ({
  type: Actions.DISMISS_GOLD_EDUCATION,
})

export const setPromptForno = (promptIfNeeded: boolean): SetPromptFornoAction => ({
  type: Actions.SET_PROMPT_FORNO,
  promptIfNeeded,
})

export const setRetryVerificationWithForno = (
  retry: boolean
): SetRetryVerificationWithFornoAction => ({
  type: Actions.SET_RETRY_VERIFICATION_WITH_FORNO,
  retry,
})

export const setUserContactDetails = (
  contactId: string,
  thumbnailPath: string | null
): SetContactDetailsAction => ({
  type: Actions.SET_USER_CONTACT_DETAILS,
  contactId,
  thumbnailPath,
})

export const migrateAccount = (): MigrateAccount => ({
  type: Actions.MIGRATE_ACCOUNT_BIP39,
})

export const clearStoredAccount = (account: string): ClearStoredAccountAction => ({
  type: Actions.CLEAR_STORED_ACCOUNT,
  account,
})
