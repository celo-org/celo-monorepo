import {
  AddressToE164NumberType,
  E164NumberToAddressType,
  E164NumberToSaltType,
} from 'src/identity/reducer'
import { AttestationCode, CodeInputType, VerificationStatus } from 'src/identity/verification'

export enum Actions {
  START_VERIFICATION = 'IDENTITY/START_VERIFICATION',
  CANCEL_VERIFICATION = 'IDENTITY/CANCEL_VERIFICATION',
  RESET_VERIFICATION = 'IDENTITY/RESET_VERIFICATION',
  SET_VERIFICATION_STATUS = 'IDENTITY/SET_VERIFICATION_STATUS',
  SET_SEEN_VERIFICATION_NUX = 'IDENTITY/SET_SEEN_VERIFICATION_NUX',
  REVOKE_VERIFICATION = 'IDENTITY/REVOKE_VERIFICATION',
  RECEIVE_ATTESTATION_MESSAGE = 'IDENTITY/RECEIVE_ATTESTATION_MESSAGE',
  INPUT_ATTESTATION_CODE = 'IDENTITY/INPUT_ATTESTATION_CODE',
  COMPLETE_ATTESTATION_CODE = 'IDENTITY/COMPLETE_ATTESTATION_CODE',
  UPDATE_E164_PHONE_NUMBER_ADDRESSES = 'IDENTITY/UPDATE_E164_PHONE_NUMBER_ADDRESSES',
  UPDATE_E164_PHONE_NUMBER_SALT = 'IDENTITY/UPDATE_E164_PHONE_NUMBER_SALT',
  FETCH_PHONE_ADDRESSES = 'IDENTITY/FETCH_PHONE_ADDRESSES',
  IMPORT_CONTACTS = 'IDENTITY/IMPORT_CONTACTS',
  UPDATE_IMPORT_SYNC_PROGRESS = 'IDENTITY/UPDATE_IMPORT_SYNC_PROGRESS',
  INCREMENT_IMPORT_SYNC_PROGRESS = 'IDENTITY/INCREMENT_IMPORT_SYNC_PROGRESS',
  END_IMPORT_CONTACTS = 'IDENTITY/END_IMPORT_CONTACTS',
  DENY_IMPORT_CONTACTS = 'IDENTITY/DENY_IMPORT_CONTACTS',
}

export interface StartVerificationAction {
  type: Actions.START_VERIFICATION
}

export interface SetVerificationStatusAction {
  type: Actions.SET_VERIFICATION_STATUS
  status: VerificationStatus
}

export interface SetHasSeenVerificationNux {
  type: Actions.SET_SEEN_VERIFICATION_NUX
  status: boolean
}

export interface CancelVerificationAction {
  type: Actions.CANCEL_VERIFICATION
}

export interface ResetVerificationAction {
  type: Actions.RESET_VERIFICATION
}

export interface RevokeVerificationAction {
  type: Actions.REVOKE_VERIFICATION
}

export interface ReceiveAttestationMessageAction {
  type: Actions.RECEIVE_ATTESTATION_MESSAGE
  message: string
  inputType: CodeInputType
}

export interface InputAttestationCodeAction {
  type: Actions.INPUT_ATTESTATION_CODE
  code: AttestationCode
}

export interface CompleteAttestationCodeAction {
  type: Actions.COMPLETE_ATTESTATION_CODE
  numComplete: number
}

export interface UpdateE164PhoneNumberAddressesAction {
  type: Actions.UPDATE_E164_PHONE_NUMBER_ADDRESSES
  e164NumberToAddress: E164NumberToAddressType
  addressToE164Number: AddressToE164NumberType
}

export interface UpdateE164PhoneNumberSaltAction {
  type: Actions.UPDATE_E164_PHONE_NUMBER_SALT
  e164NumberToSalt: E164NumberToSaltType
}

export interface FetchPhoneAddressesAction {
  type: Actions.FETCH_PHONE_ADDRESSES
  e164Number: string
}

export interface ImportContactsAction {
  type: Actions.IMPORT_CONTACTS
}

export interface UpdateImportSyncProgress {
  type: Actions.UPDATE_IMPORT_SYNC_PROGRESS
  current: number
  total: number
}

export interface IncrementImportSyncProgress {
  type: Actions.INCREMENT_IMPORT_SYNC_PROGRESS
  increment: number
}

export interface EndImportContactsAction {
  type: Actions.END_IMPORT_CONTACTS
  success: boolean
}

export interface DenyImportContactsAction {
  type: Actions.DENY_IMPORT_CONTACTS
}

export type ActionTypes =
  | StartVerificationAction
  | CancelVerificationAction
  | ResetVerificationAction
  | SetVerificationStatusAction
  | SetHasSeenVerificationNux
  | ReceiveAttestationMessageAction
  | InputAttestationCodeAction
  | CompleteAttestationCodeAction
  | UpdateE164PhoneNumberAddressesAction
  | UpdateE164PhoneNumberSaltAction
  | ImportContactsAction
  | UpdateImportSyncProgress
  | IncrementImportSyncProgress
  | EndImportContactsAction
  | DenyImportContactsAction

export const startVerification = (): StartVerificationAction => ({
  type: Actions.START_VERIFICATION,
})

export const cancelVerification = (): CancelVerificationAction => ({
  type: Actions.CANCEL_VERIFICATION,
})

export const resetVerification = (): ResetVerificationAction => ({
  type: Actions.RESET_VERIFICATION,
})

export const setVerificationStatus = (status: VerificationStatus): SetVerificationStatusAction => ({
  type: Actions.SET_VERIFICATION_STATUS,
  status,
})

export const setHasSeenVerificationNux = (status: boolean): SetHasSeenVerificationNux => ({
  type: Actions.SET_SEEN_VERIFICATION_NUX,
  status,
})

export const revokeVerification = (): RevokeVerificationAction => ({
  type: Actions.REVOKE_VERIFICATION,
})

export const receiveAttestationMessage = (
  message: string,
  inputType: CodeInputType
): ReceiveAttestationMessageAction => ({
  type: Actions.RECEIVE_ATTESTATION_MESSAGE,
  message,
  inputType,
})

export const inputAttestationCode = (code: AttestationCode): InputAttestationCodeAction => ({
  type: Actions.INPUT_ATTESTATION_CODE,
  code,
})

export const completeAttestationCode = (
  numComplete: number = 1
): CompleteAttestationCodeAction => ({
  type: Actions.COMPLETE_ATTESTATION_CODE,
  numComplete,
})

export const fetchPhoneAddresses = (e164Number: string): FetchPhoneAddressesAction => ({
  type: Actions.FETCH_PHONE_ADDRESSES,
  e164Number,
})

export const updateE164PhoneNumberAddresses = (
  e164NumberToAddress: E164NumberToAddressType,
  addressToE164Number: AddressToE164NumberType
): UpdateE164PhoneNumberAddressesAction => ({
  type: Actions.UPDATE_E164_PHONE_NUMBER_ADDRESSES,
  e164NumberToAddress,
  addressToE164Number,
})

export const updateE164PhoneNumberSalts = (
  e164NumberToSalt: E164NumberToSaltType
): UpdateE164PhoneNumberSaltAction => ({
  type: Actions.UPDATE_E164_PHONE_NUMBER_SALT,
  e164NumberToSalt,
})

export const importContacts = (): ImportContactsAction => ({
  type: Actions.IMPORT_CONTACTS,
})

export const updateImportSyncProgress = (
  current: number,
  total: number
): UpdateImportSyncProgress => ({
  type: Actions.UPDATE_IMPORT_SYNC_PROGRESS,
  current,
  total,
})

export const incrementImportSyncProgress = (increment: number): IncrementImportSyncProgress => ({
  type: Actions.INCREMENT_IMPORT_SYNC_PROGRESS,
  increment,
})

export const endImportContacts = (success: boolean): EndImportContactsAction => ({
  type: Actions.END_IMPORT_CONTACTS,
  success,
})

export const denyImportContacts = (): DenyImportContactsAction => ({
  type: Actions.DENY_IMPORT_CONTACTS,
})
