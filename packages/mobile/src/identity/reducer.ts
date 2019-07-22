import { Actions, ActionTypes } from 'src/identity/actions'
import { AttestationCode, NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { RootState } from 'src/redux/reducers'

export interface AddressToE164NumberType {
  [address: string]: string | null
}

export interface E164NumberToAddressType {
  [e164PhoneNumber: string]: string | null // null means unverified
}

export interface State {
  attestationCodes: AttestationCode[]
  numCompleteAttestations: number
  verificationFailed: boolean
  addressToE164Number: AddressToE164NumberType
  e164NumberToAddress: E164NumberToAddressType
  startedVerification: boolean
  askedContactsPermission: boolean
}

const initialState = {
  attestationCodes: [],
  numCompleteAttestations: 0,
  verificationFailed: false,
  addressToE164Number: {},
  e164NumberToAddress: {},
  startedVerification: false,
  askedContactsPermission: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.RESET_VERIFICATION:
      return {
        ...state,
        attestationCodes: [],
        numCompleteAttestations: 0,
        verificationFailed: false,
        startedVerification: true,
      }
    case Actions.END_VERIFICATION:
      return action.success
        ? {
            ...state,
            numCompleteAttestations: NUM_ATTESTATIONS_REQUIRED,
            verificationFailed: false,
          }
        : {
            ...state,
            verificationFailed: true,
            startedVerification: false,
          }
    case Actions.INPUT_ATTESTATION_CODE:
      return {
        ...state,
        attestationCodes: [...state.attestationCodes, action.code],
      }
    case Actions.COMPLETE_ATTESTATION_CODE:
      return {
        ...state,
        numCompleteAttestations: state.numCompleteAttestations + action.numComplete,
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
        askedContactsPermission: true,
      }
    default:
      return state
  }
}

export const attestationCodesSelector = (state: RootState) => state.identity.attestationCodes
export const e164NumberToAddressSelector = (state: RootState) => state.identity.e164NumberToAddress
export const addressToE164NumberSelector = (state: RootState) => state.identity.addressToE164Number
