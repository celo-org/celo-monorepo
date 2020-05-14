import { RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/identity/actions'
import { AttestationCode, VerificationStatus } from 'src/identity/verification'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export const ATTESTATION_CODE_PLACEHOLDER = 'ATTESTATION_CODE_PLACEHOLDER'
export const ATTESTATION_ISSUER_PLACEHOLDER = 'ATTESTATION_ISSUER_PLACEHOLDER'

// TODO currently treating addresses to e164Number as 1:1 but
// there are rare cases where an address could have two numbers mapped to it.
// E.g. user imported backup phrase onto second phone and then verified again with a new number
export interface AddressToE164NumberType {
  [address: string]: string | null
}

export interface E164NumberToAddressType {
  [e164PhoneNumber: string]: string[] | null | undefined // null means unverified
}

export interface E164NumberToSaltType {
  [e164PhoneNumber: string]: string | null // null means unverified
}

export interface ContactMappingProgress {
  current: number
  total: number
}

export interface State {
  attestationCodes: AttestationCode[]
  // we store acceptedAttestationCodes to tell user if code
  // was already used even after Actions.RESET_VERIFICATION
  acceptedAttestationCodes: AttestationCode[]
  numCompleteAttestations: number
  verificationStatus: VerificationStatus
  hasSeenVerificationNux: boolean
  addressToE164Number: AddressToE164NumberType
  // Note: Do not access values in this directly, use the `getAddressFromPhoneNumber` helper in contactMapping
  e164NumberToAddress: E164NumberToAddressType
  e164NumberToSalt: E164NumberToSaltType
  askedContactsPermission: boolean
  isLoadingImportContacts: boolean
  contactMappingProgress: ContactMappingProgress
}

const initialState: State = {
  attestationCodes: [],
  acceptedAttestationCodes: [],
  numCompleteAttestations: 0,
  verificationStatus: 0,
  hasSeenVerificationNux: false,
  addressToE164Number: {},
  e164NumberToAddress: {},
  e164NumberToSalt: {},
  askedContactsPermission: false,
  isLoadingImportContacts: false,
  contactMappingProgress: {
    current: 0,
    total: 0,
  },
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'identity'),
        verificationStatus: VerificationStatus.Stopped,
        isLoadingImportContacts: false,
        contactMappingProgress: {
          current: 0,
          total: 0,
        },
      }
    }
    case Actions.RESET_VERIFICATION:
      return {
        ...state,
        attestationCodes: [],
        numCompleteAttestations: 0,
        verificationStatus: VerificationStatus.Stopped,
      }
    case Actions.SET_VERIFICATION_STATUS:
      return {
        ...state,
        verificationStatus: action.status,
        // Reset accepted codes on fail otherwise there's no way for user
        // to try again with same codes
        acceptedAttestationCodes:
          action.status === VerificationStatus.Failed ? [] : state.acceptedAttestationCodes,
      }
    case Actions.SET_SEEN_VERIFICATION_NUX:
      return {
        ...state,
        hasSeenVerificationNux: action.status,
      }
    case Actions.INPUT_ATTESTATION_CODE:
      return {
        ...state,
        attestationCodes: [...state.attestationCodes, action.code],
        acceptedAttestationCodes: [...state.acceptedAttestationCodes, action.code],
      }
    case Actions.COMPLETE_ATTESTATION_CODE:
      return {
        ...state,
        ...completeCodeReducer(state, state.numCompleteAttestations + action.numComplete),
      }
    case Actions.UPDATE_E164_PHONE_NUMBER_ADDRESSES:
      return {
        ...state,
        addressToE164Number: { ...state.addressToE164Number, ...action.addressToE164Number },
        e164NumberToAddress: {
          ...state.e164NumberToAddress,
          ...action.e164NumberToAddress,
        },
      }
    case Actions.UPDATE_E164_PHONE_NUMBER_SALT:
      return {
        ...state,
        e164NumberToSalt: { ...state.e164NumberToSalt, ...action.e164NumberToSalt },
      }
    case Actions.IMPORT_CONTACTS:
      return {
        ...state,
        isLoadingImportContacts: true,
        askedContactsPermission: true,
        contactMappingProgress: { current: 0, total: 0 },
      }
    case Actions.UPDATE_IMPORT_SYNC_PROGRESS:
      return {
        ...state,
        contactMappingProgress: { current: action.current, total: action.total },
      }
    case Actions.INCREMENT_IMPORT_SYNC_PROGRESS:
      return {
        ...state,
        contactMappingProgress: {
          current: state.contactMappingProgress.current + action.increment,
          total: state.contactMappingProgress.total,
        },
      }
    case Actions.END_IMPORT_CONTACTS:
      return {
        ...state,
        isLoadingImportContacts: false,
        contactMappingProgress: action.success
          ? {
              current: state.contactMappingProgress.total,
              total: state.contactMappingProgress.total,
            }
          : state.contactMappingProgress,
      }
    case Actions.DENY_IMPORT_CONTACTS:
      return {
        ...state,
        askedContactsPermission: true,
      }
    default:
      return state
  }
}

const completeCodeReducer = (state: State, numCompleteAttestations: number) => {
  const { attestationCodes } = state
  // Ensure numCompleteAttestations many codes are filled
  for (let i = 0; i < numCompleteAttestations; i++) {
    attestationCodes[i] = attestationCodes[i] || {
      code: ATTESTATION_CODE_PLACEHOLDER,
      issuer: ATTESTATION_ISSUER_PLACEHOLDER,
    }
  }
  return {
    numCompleteAttestations,
    attestationCodes: [...attestationCodes],
  }
}

export const attestationCodesSelector = (state: RootState) => state.identity.attestationCodes
export const acceptedAttestationCodesSelector = (state: RootState) =>
  state.identity.acceptedAttestationCodes
export const e164NumberToAddressSelector = (state: RootState) => state.identity.e164NumberToAddress
export const addressToE164NumberSelector = (state: RootState) => state.identity.addressToE164Number
export const e164NumberToSaltSelector = (state: RootState) => state.identity.e164NumberToSalt
export const contactMappingProgressSelector = (state: RootState) =>
  state.identity.contactMappingProgress
export const isLoadingImportContactsSelector = (state: RootState) =>
  state.identity.isLoadingImportContacts
