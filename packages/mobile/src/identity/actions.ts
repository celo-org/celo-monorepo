import { E164Number } from '@celo/utils/src/io'
import {
  AddressToE164NumberType,
  AddressValidationType,
  E164NumberToAddressType,
  E164NumberToSaltType,
} from 'src/identity/reducer'
import { ContactMatches, ImportContactsStatus, VerificationStatus } from 'src/identity/types'
import { AttestationCode, CodeInputType } from 'src/identity/verification'
import { Recipient } from 'src/recipients/recipient'

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
  FETCH_ADDRESSES_AND_VALIDATION_STATUS = 'IDENTITY/FETCH_ADDRESSES_AND_VALIDATION_STATUS',
  IMPORT_CONTACTS = 'IDENTITY/IMPORT_CONTACTS',
  UPDATE_IMPORT_CONTACT_PROGRESS = 'IDENTITY/UPDATE_IMPORT_CONTACT_PROGRESS',
  CANCEL_IMPORT_CONTACTS = 'IDENTITY/CANCEL_IMPORT_CONTACTS',
  END_IMPORT_CONTACTS = 'IDENTITY/END_IMPORT_CONTACTS',
  DENY_IMPORT_CONTACTS = 'IDENTITY/DENY_IMPORT_CONTACTS',
  ADD_CONTACT_MATCHES = 'IDENTITY/ADD_CONTACT_MATCHES',
  VALIDATE_RECIPIENT_ADDRESS = 'SEND/VALIDATE_RECIPIENT_ADDRESS',
  VALIDATE_RECIPIENT_ADDRESS_SUCCESS = 'SEND/VALIDATE_RECIPIENT_ADDRESS_SUCCESS',
  VALIDATE_RECIPIENT_ADDRESS_RESET = 'SEND/VALIDATE_RECIPIENT_ADDRESS_RESET',
  REQUIRE_SECURE_SEND = 'SEND/REQUIRE_SECURE_SEND',
  END_FETCHING_ADDRESSES = 'END_FETCHING_ADDRESSES',
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

export interface FetchAddressesAndValidateAction {
  type: Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS
  e164Number: string
  requesterAddress?: string
}

export interface ImportContactsAction {
  type: Actions.IMPORT_CONTACTS
  doMatchmaking: boolean
}

export interface UpdateImportContactProgress {
  type: Actions.UPDATE_IMPORT_CONTACT_PROGRESS
  status?: ImportContactsStatus
  current?: number
  total?: number
}

export interface CancelImportContactsAction {
  type: Actions.CANCEL_IMPORT_CONTACTS
}

export interface EndImportContactsAction {
  type: Actions.END_IMPORT_CONTACTS
  success: boolean
}

export interface DenyImportContactsAction {
  type: Actions.DENY_IMPORT_CONTACTS
}

export interface AddContactMatchesAction {
  type: Actions.ADD_CONTACT_MATCHES
  matches: ContactMatches
}

export interface ValidateRecipientAddressAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS
  userInputOfFullAddressOrLastFourDigits: string
  addressValidationType: AddressValidationType
  recipient: Recipient
  requesterAddress?: string
}

export interface ValidateRecipientAddressSuccessAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS
  e164Number: string
  validatedAddress: string
}

export interface ValidateRecipientAddressResetAction {
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_RESET
  e164Number: string
}

export interface RequireSecureSendAction {
  type: Actions.REQUIRE_SECURE_SEND
  e164Number: E164Number
  addressValidationType: AddressValidationType
}

export interface EndFetchingAddressesAction {
  type: Actions.END_FETCHING_ADDRESSES
  e164Number: string
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
  | UpdateImportContactProgress
  | EndImportContactsAction
  | DenyImportContactsAction
  | AddContactMatchesAction
  | ValidateRecipientAddressAction
  | ValidateRecipientAddressSuccessAction
  | ValidateRecipientAddressResetAction
  | RequireSecureSendAction
  | FetchAddressesAndValidateAction
  | EndFetchingAddressesAction

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

export const fetchAddressesAndValidate = (
  e164Number: string,
  requesterAddress?: string
): FetchAddressesAndValidateAction => ({
  type: Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS,
  e164Number,
  requesterAddress,
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

export const importContacts = (doMatchmaking: boolean = false): ImportContactsAction => ({
  type: Actions.IMPORT_CONTACTS,
  doMatchmaking,
})

export const updateImportContactsProgress = (
  status?: ImportContactsStatus,
  current?: number,
  total?: number
): UpdateImportContactProgress => ({
  type: Actions.UPDATE_IMPORT_CONTACT_PROGRESS,
  status,
  current,
  total,
})

export const cancelImportContacts = (): CancelImportContactsAction => ({
  type: Actions.CANCEL_IMPORT_CONTACTS,
})

export const endImportContacts = (success: boolean): EndImportContactsAction => ({
  type: Actions.END_IMPORT_CONTACTS,
  success,
})

export const denyImportContacts = (): DenyImportContactsAction => ({
  type: Actions.DENY_IMPORT_CONTACTS,
})

export const addContactsMatches = (matches: ContactMatches): AddContactMatchesAction => ({
  type: Actions.ADD_CONTACT_MATCHES,
  matches,
})

export const validateRecipientAddress = (
  userInputOfFullAddressOrLastFourDigits: string,
  addressValidationType: AddressValidationType,
  recipient: Recipient,
  requesterAddress?: string
): ValidateRecipientAddressAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS,
  userInputOfFullAddressOrLastFourDigits,
  addressValidationType,
  recipient,
  requesterAddress,
})

export const validateRecipientAddressSuccess = (
  e164Number: E164Number,
  validatedAddress: string
): ValidateRecipientAddressSuccessAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS,
  e164Number,
  validatedAddress,
})

export const validateRecipientAddressReset = (
  e164Number: E164Number
): ValidateRecipientAddressResetAction => ({
  type: Actions.VALIDATE_RECIPIENT_ADDRESS_RESET,
  e164Number,
})

export const requireSecureSend = (
  e164Number: E164Number,
  addressValidationType: AddressValidationType
): RequireSecureSendAction => ({
  type: Actions.REQUIRE_SECURE_SEND,
  e164Number,
  addressValidationType,
})

export const endFetchingAddresses = (e164Number: string): EndFetchingAddressesAction => ({
  type: Actions.END_FETCHING_ADDRESSES,
  e164Number,
})
