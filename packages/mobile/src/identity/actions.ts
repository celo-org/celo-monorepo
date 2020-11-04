import { E164Number } from '@celo/utils/src/io'
import {
  AddressToE164NumberType,
  AddressValidationType,
  E164NumberToAddressType,
  E164NumberToSaltType,
  UpdatableVerificationState,
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
  SET_COMPLETED_CODES = 'IDENTITY/SET_COMPLETED_CODES',
  REVOKE_VERIFICATION = 'IDENTITY/REVOKE_VERIFICATION',
  RECEIVE_ATTESTATION_MESSAGE = 'IDENTITY/RECEIVE_ATTESTATION_MESSAGE',
  INPUT_ATTESTATION_CODE = 'IDENTITY/INPUT_ATTESTATION_CODE',
  COMPLETE_ATTESTATION_CODE = 'IDENTITY/COMPLETE_ATTESTATION_CODE',
  UPDATE_E164_PHONE_NUMBER_ADDRESSES = 'IDENTITY/UPDATE_E164_PHONE_NUMBER_ADDRESSES',
  UPDATE_E164_PHONE_NUMBER_SALT = 'IDENTITY/UPDATE_E164_PHONE_NUMBER_SALT',
  FETCH_ADDRESSES_AND_VALIDATION_STATUS = 'IDENTITY/FETCH_ADDRESSES_AND_VALIDATION_STATUS',
  END_FETCHING_ADDRESSES = 'IDENTITY/END_FETCHING_ADDRESSES',
  IMPORT_CONTACTS = 'IDENTITY/IMPORT_CONTACTS',
  UPDATE_IMPORT_CONTACT_PROGRESS = 'IDENTITY/UPDATE_IMPORT_CONTACT_PROGRESS',
  CANCEL_IMPORT_CONTACTS = 'IDENTITY/CANCEL_IMPORT_CONTACTS',
  END_IMPORT_CONTACTS = 'IDENTITY/END_IMPORT_CONTACTS',
  DENY_IMPORT_CONTACTS = 'IDENTITY/DENY_IMPORT_CONTACTS',
  ADD_CONTACT_MATCHES = 'IDENTITY/ADD_CONTACT_MATCHES',
  VALIDATE_RECIPIENT_ADDRESS = 'IDENTITY/VALIDATE_RECIPIENT_ADDRESS',
  VALIDATE_RECIPIENT_ADDRESS_SUCCESS = 'IDENTITY/VALIDATE_RECIPIENT_ADDRESS_SUCCESS',
  VALIDATE_RECIPIENT_ADDRESS_RESET = 'IDENTITY/VALIDATE_RECIPIENT_ADDRESS_RESET',
  REQUIRE_SECURE_SEND = 'IDENTITY/REQUIRE_SECURE_SEND',
  FETCH_DATA_ENCRYPTION_KEY = 'IDENTITY/FETCH_DATA_ENCRYPTION_KEY',
  UPDATE_ADDRESS_DEK_MAP = 'IDENTITY/UPDATE_ADDRESS_DEK_MAP',
  FETCH_VERIFICATION_STATE = 'IDENTITY/FETCH_VERIFICATION_STATE',
  UPDATE_VERIFICATION_STATE = 'IDENTITY/UPDATE_VERIFICATION_STATE',
  RESEND_ATTESTATIONS = 'IDENTITY/RESEND_ATTESTATIONS',
  SET_LAST_REVEAL_ATTEMPT = 'IDENTITY/SET_LAST_REVEAL_ATTEMPT',
  REPORT_REVEAL_STATUS = 'IDENTITY/REPORT_REVEAL_STATUS',
}

export interface StartVerificationAction {
  type: Actions.START_VERIFICATION
  withoutRevealing: boolean
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

export interface SetCompletedCodesAction {
  type: Actions.SET_COMPLETED_CODES
  numComplete: number
}

export interface InputAttestationCodeAction {
  type: Actions.INPUT_ATTESTATION_CODE
  code: AttestationCode
}

export interface CompleteAttestationCodeAction {
  type: Actions.COMPLETE_ATTESTATION_CODE
  code: AttestationCode
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

export interface EndFetchingAddressesAction {
  type: Actions.END_FETCHING_ADDRESSES
  e164Number: string
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

export interface FetchDataEncryptionKeyAction {
  type: Actions.FETCH_DATA_ENCRYPTION_KEY
  address: string
}

export interface UpdateAddressDekMapAction {
  type: Actions.UPDATE_ADDRESS_DEK_MAP
  address: string
  dataEncryptionKey: string | null
}

export interface FetchVerificationState {
  type: Actions.FETCH_VERIFICATION_STATE
}

export interface UpdateVerificationState {
  type: Actions.UPDATE_VERIFICATION_STATE
  state: UpdatableVerificationState
}

export interface ResendAttestations {
  type: Actions.RESEND_ATTESTATIONS
}

export interface SetLastRevealAttempt {
  type: Actions.SET_LAST_REVEAL_ATTEMPT
  time: number
}

export interface ReportRevealStatusAction {
  type: Actions.REPORT_REVEAL_STATUS
  attestationServiceUrl: string
  account: string
  issuer: string
  e164Number: string
  pepper: string
}

export type ActionTypes =
  | StartVerificationAction
  | CancelVerificationAction
  | ResetVerificationAction
  | SetVerificationStatusAction
  | SetHasSeenVerificationNux
  | SetCompletedCodesAction
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
  | FetchDataEncryptionKeyAction
  | UpdateAddressDekMapAction
  | FetchVerificationState
  | UpdateVerificationState
  | ResendAttestations
  | SetLastRevealAttempt
  | ReportRevealStatusAction

export const startVerification = (withoutRevealing: boolean = false): StartVerificationAction => ({
  type: Actions.START_VERIFICATION,
  withoutRevealing,
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

export const setCompletedCodes = (numComplete: number): SetCompletedCodesAction => ({
  type: Actions.SET_COMPLETED_CODES,
  numComplete,
})

export const inputAttestationCode = (code: AttestationCode): InputAttestationCodeAction => ({
  type: Actions.INPUT_ATTESTATION_CODE,
  code,
})

export const completeAttestationCode = (code: AttestationCode): CompleteAttestationCodeAction => ({
  type: Actions.COMPLETE_ATTESTATION_CODE,
  code,
})

export const fetchAddressesAndValidate = (
  e164Number: string,
  requesterAddress?: string
): FetchAddressesAndValidateAction => ({
  type: Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS,
  e164Number,
  requesterAddress,
})

export const endFetchingAddresses = (e164Number: string): EndFetchingAddressesAction => ({
  type: Actions.END_FETCHING_ADDRESSES,
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

export const fetchDataEncryptionKey = (address: string): FetchDataEncryptionKeyAction => ({
  type: Actions.FETCH_DATA_ENCRYPTION_KEY,
  address,
})

export const updateAddressDekMap = (
  address: string,
  dataEncryptionKey: string | null
): UpdateAddressDekMapAction => ({
  type: Actions.UPDATE_ADDRESS_DEK_MAP,
  address,
  dataEncryptionKey,
})

export const fetchVerificationState = (): FetchVerificationState => ({
  type: Actions.FETCH_VERIFICATION_STATE,
})

export const udpateVerificationState = (
  state: UpdatableVerificationState
): UpdateVerificationState => ({
  type: Actions.UPDATE_VERIFICATION_STATE,
  state,
})

export const resendAttestations = (): ResendAttestations => ({
  type: Actions.RESEND_ATTESTATIONS,
})

export const setLastRevealAttempt = (time: number): SetLastRevealAttempt => ({
  type: Actions.SET_LAST_REVEAL_ATTEMPT,
  time,
})

export const reportRevealStatus = (
  attestationServiceUrl: string,
  account: string,
  issuer: string,
  e164Number: string,
  pepper: string
): ReportRevealStatusAction => {
  return {
    type: Actions.REPORT_REVEAL_STATUS,
    attestationServiceUrl,
    account,
    issuer,
    e164Number,
    pepper,
  }
}
