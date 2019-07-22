import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import { AttestationCode, CodeInputType } from 'src/identity/verification'

export enum Actions {
  START_VERIFICATION = 'IDENTITY/START_VERIFICATION',
  END_VERIFICATION = 'IDENTITY/END_VERIFICATION',
  CANCEL_VERIFICATION = 'IDENTITY/CANCEL_VERIFICATION',
  RESET_VERIFICATION = 'IDENTITY/RESET_VERIFICATION',
  REVOKE_VERIFICATION = 'IDENTITY/REVOKE_VERIFICATION',
  RECEIVE_ATTESTATION_MESSAGE = 'IDENTITY/RECEIVE_ATTESTATION_MESSAGE',
  INPUT_ATTESTATION_CODE = 'IDENTITY/INPUT_ATTESTATION_CODE',
  COMPLETE_ATTESTATION_CODE = 'IDENTITY/COMPLETE_ATTESTATION_CODE',
  UPDATE_E164_PHONE_NUMBER_ADDRESSES = 'IDENTITY/UPDATE_E164_PHONE_NUMBER_ADDRESSES',
  FETCH_PHONE_ADDRESSES = 'IDENTITY/FETCH_PHONE_ADDRESSES',
  IMPORT_CONTACTS = 'IDENTITY/IMPORT_CONTACTS',
}

export interface StartVerificationAction {
  type: Actions.START_VERIFICATION
}

export interface EndVerificationAction {
  type: Actions.END_VERIFICATION
  success: boolean
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

export interface FetchPhoneAddressesAction {
  type: Actions.FETCH_PHONE_ADDRESSES
  numbers: string[]
}

export interface ImportContactsAction {
  type: Actions.IMPORT_CONTACTS
}

export type ActionTypes =
  | StartVerificationAction
  | EndVerificationAction
  | CancelVerificationAction
  | ResetVerificationAction
  | ReceiveAttestationMessageAction
  | InputAttestationCodeAction
  | CompleteAttestationCodeAction
  | UpdateE164PhoneNumberAddressesAction
  | ImportContactsAction

export const startVerification = (): StartVerificationAction => ({
  type: Actions.START_VERIFICATION,
})

export const endVerification = (success: boolean = true): EndVerificationAction => ({
  type: Actions.END_VERIFICATION,
  success,
})

export const cancelVerification = (): CancelVerificationAction => ({
  type: Actions.CANCEL_VERIFICATION,
})

export const resetVerification = (): ResetVerificationAction => ({
  type: Actions.RESET_VERIFICATION,
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

export const fetchPhoneAddresses = (numbers: string[]): FetchPhoneAddressesAction => ({
  type: Actions.FETCH_PHONE_ADDRESSES,
  numbers,
})

export const updateE164PhoneNumberAddresses = (
  e164NumberToAddress: E164NumberToAddressType,
  addressToE164Number: AddressToE164NumberType
): UpdateE164PhoneNumberAddressesAction => ({
  type: Actions.UPDATE_E164_PHONE_NUMBER_ADDRESSES,
  e164NumberToAddress,
  addressToE164Number,
})

export const importContacts = (): ImportContactsAction => ({
  type: Actions.IMPORT_CONTACTS,
})
