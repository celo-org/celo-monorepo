import { Actions, ActionTypes } from 'src/identity/actions'
import { AttestationCode, VerificationStatus } from 'src/identity/verification'
import { RootState } from 'src/redux/reducers'

export const ATTESTATION_CODE_PLACEHOLDER = 'ATTESTATION_CODE_PLACEHOLDER'
export const ATTESTATION_ISSUER_PLACEHOLDER = 'ATTESTATION_ISSUER_PLACEHOLDER'

export interface AddressToE164NumberType {
  [address: string]: string | null
}

export interface E164NumberToAddressType {
  [e164PhoneNumber: string]: string | null // null means unverified
}

export interface State {
  attestationCodes: AttestationCode[]
  numCompleteAttestations: number
  verificationStatus: VerificationStatus
  hasSeenVerificationNux: boolean
  addressToE164Number: AddressToE164NumberType
  e164NumberToAddress: E164NumberToAddressType
  askedContactsPermission: boolean
  isLoadingImportContacts: boolean
}

const initialState: State = {
  attestationCodes: [],
  numCompleteAttestations: 0,
  verificationStatus: 0,
  hasSeenVerificationNux: false,
  addressToE164Number: {},
  e164NumberToAddress: {},
  askedContactsPermission: false,
  isLoadingImportContacts: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
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
    case Actions.IMPORT_CONTACTS:
      return {
        ...state,
        isLoadingImportContacts: true,
        askedContactsPermission: true,
      }
    case Actions.END_IMPORT_CONTACTS:
      return {
        ...state,
        isLoadingImportContacts: false,
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
export const e164NumberToAddressSelector = (state: RootState) => state.identity.e164NumberToAddress
export const addressToE164NumberSelector = (state: RootState) => state.identity.addressToE164Number
