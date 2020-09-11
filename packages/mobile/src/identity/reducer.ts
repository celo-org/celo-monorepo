import {
  isBalanceSufficientForSigRetrieval,
  PhoneNumberHashDetails,
} from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import { ActionableAttestation } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationsStatus } from '@celo/utils/src/attestations'
import BigNumber from 'bignumber.js'
import dotProp from 'dot-prop-immutable'
import { RehydrateAction } from 'redux-persist'
import { createSelector } from 'reselect'
import { Actions as AccountActions, ClearStoredAccountAction } from 'src/account/actions'
import { VERIFICATION_STATE_EXPIRY_SECONDS } from 'src/config'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { Actions, ActionTypes } from 'src/identity/actions'
import { ContactMatches, ImportContactsStatus, VerificationStatus } from 'src/identity/types'
import {
  AttestationCode,
  ESTIMATED_COST_PER_ATTESTATION,
  NUM_ATTESTATIONS_REQUIRED,
} from 'src/identity/verification'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { timeDeltaInSeconds } from 'src/utils/time'

export const ATTESTATION_CODE_PLACEHOLDER = 'ATTESTATION_CODE_PLACEHOLDER'
export const ATTESTATION_ISSUER_PLACEHOLDER = 'ATTESTATION_ISSUER_PLACEHOLDER'

export interface AddressToE164NumberType {
  [address: string]: string | null
}

export interface E164NumberToAddressType {
  [e164PhoneNumber: string]: string[] | null | undefined // null means unverified
}

export interface E164NumberToSaltType {
  [e164PhoneNumber: string]: string | null // null means unverified
}

export interface AddressToDataEncryptionKeyType {
  [address: string]: string | null // null means no DEK registered
}

export interface ImportContactProgress {
  status: ImportContactsStatus
  current: number
  total: number
}

export enum AddressValidationType {
  FULL = 'full',
  PARTIAL = 'partial',
  NONE = 'none',
}

export interface SecureSendPhoneNumberMapping {
  [e164Number: string]: SecureSendDetails
}

export interface SecureSendDetails {
  address: string | undefined
  addressValidationType: AddressValidationType
  isFetchingAddresses: boolean | undefined
  validationSuccessful: boolean | undefined
}

export interface UpdatableVerificationState {
  phoneHashDetails: PhoneNumberHashDetails
  actionableAttestations: ActionableAttestation[]
  status: AttestationsStatus
}

export type VerificationState = State['verificationState'] & {
  isBalanceSufficient: boolean
}

export interface State {
  attestationCodes: AttestationCode[]
  // we store acceptedAttestationCodes to tell user if code
  // was already used even after Actions.RESET_VERIFICATION
  acceptedAttestationCodes: AttestationCode[]
  // numCompleteAttestations is controlled locally
  numCompleteAttestations: number
  verificationStatus: VerificationStatus
  hasSeenVerificationNux: boolean
  addressToE164Number: AddressToE164NumberType
  // Note: Do not access values in this directly, use the `getAddressFromPhoneNumber` helper in contactMapping
  e164NumberToAddress: E164NumberToAddressType
  e164NumberToSalt: E164NumberToSaltType
  addressToDataEncryptionKey: AddressToDataEncryptionKeyType
  // Has the user already been asked for contacts permission
  askedContactsPermission: boolean
  importContactsProgress: ImportContactProgress
  // Contacts found during the matchmaking process
  matchedContacts: ContactMatches
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
  // verificationState is fetched from the network
  verificationState: {
    isLoading: boolean
    lastFetch: number | null
  } & UpdatableVerificationState
}

const initialState: State = {
  attestationCodes: [],
  acceptedAttestationCodes: [],
  numCompleteAttestations: 0,
  verificationStatus: VerificationStatus.Stopped,
  hasSeenVerificationNux: false,
  addressToE164Number: {},
  e164NumberToAddress: {},
  e164NumberToSalt: {},
  addressToDataEncryptionKey: {},
  askedContactsPermission: false,
  importContactsProgress: {
    status: ImportContactsStatus.Stopped,
    current: 0,
    total: 0,
  },
  matchedContacts: {},
  secureSendPhoneNumberMapping: {},
  verificationState: {
    isLoading: false,
    phoneHashDetails: {
      e164Number: '',
      phoneHash: '',
      pepper: '',
    },
    actionableAttestations: [],
    status: {
      isVerified: false,
      numAttestationsRemaining: NUM_ATTESTATIONS_REQUIRED,
      total: 0,
      completed: 0,
    },
    lastFetch: null,
  },
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | ClearStoredAccountAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'identity'),
        verificationStatus: VerificationStatus.Stopped,
        importContactsProgress: {
          status: ImportContactsStatus.Stopped,
          current: 0,
          total: 0,
        },
        verificationState: initialState.verificationState,
        isFetchingAddresses: false,
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
      }
    case Actions.SET_SEEN_VERIFICATION_NUX:
      return {
        ...state,
        hasSeenVerificationNux: action.status,
      }
    case Actions.SET_COMPLETED_CODES:
      return {
        ...state,
        ...completeCodeReducer(state, action.numComplete),
      }

    case Actions.INPUT_ATTESTATION_CODE:
      return {
        ...state,
        attestationCodes: [...state.attestationCodes, action.code],
      }
    case Actions.COMPLETE_ATTESTATION_CODE:
      return {
        ...state,
        ...completeCodeReducer(state, state.numCompleteAttestations + 1),
        acceptedAttestationCodes: [...state.acceptedAttestationCodes, action.code],
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
        askedContactsPermission: true,
        importContactsProgress: { status: ImportContactsStatus.Prepping, current: 0, total: 0 },
      }
    case Actions.UPDATE_IMPORT_CONTACT_PROGRESS:
      const curProgress = state.importContactsProgress
      return {
        ...state,
        importContactsProgress: {
          current: action.current ?? curProgress.current,
          total: action.total ?? curProgress.total,
          status: action.status ?? curProgress.status,
        },
      }
    case Actions.END_IMPORT_CONTACTS:
      const { success } = action
      return {
        ...state,
        importContactsProgress: {
          ...state.importContactsProgress,
          status: success ? ImportContactsStatus.Done : ImportContactsStatus.Failed,
        },
      }
    case Actions.DENY_IMPORT_CONTACTS:
      return {
        ...state,
        askedContactsPermission: true,
      }
    case Actions.ADD_CONTACT_MATCHES:
      const matchedContacts = { ...state.matchedContacts, ...action.matches }
      return {
        ...state,
        matchedContacts,
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_SUCCESS:
      return {
        ...state,
        // Overwrite the previous mapping when a new address is validated
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}`,
          {
            address: action.validatedAddress,
            addressValidationType: AddressValidationType.NONE,
            validationSuccessful: true,
          }
        ),
      }
    case Actions.VALIDATE_RECIPIENT_ADDRESS_RESET:
      return {
        ...state,
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}.validationSuccessful`,
          false
        ),
      }
    case Actions.REQUIRE_SECURE_SEND:
      return {
        ...state,
        // Erase the previous mapping when new validation is required
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}`,
          {
            address: undefined,
            addressValidationType: action.addressValidationType,
          }
        ),
      }
    case Actions.FETCH_ADDRESSES_AND_VALIDATION_STATUS:
      return {
        ...state,
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}.isFetchingAddresses`,
          true
        ),
      }
    case Actions.END_FETCHING_ADDRESSES:
      return {
        ...state,
        secureSendPhoneNumberMapping: dotProp.set(
          state.secureSendPhoneNumberMapping,
          `${action.e164Number}.isFetchingAddresses`,
          false
        ),
      }
    case Actions.UPDATE_ADDRESS_DEK_MAP:
      return {
        ...state,
        addressToDataEncryptionKey: dotProp.set(
          state.addressToDataEncryptionKey,
          action.address,
          action.dataEncryptionKey
        ),
      }
    case AccountActions.CLEAR_STORED_ACCOUNT:
      return {
        ...initialState,
        addressToE164Number: state.addressToE164Number,
        e164NumberToAddress: state.e164NumberToAddress,
        e164NumberToSalt: state.e164NumberToSalt,
        matchedContacts: state.matchedContacts,
        secureSendPhoneNumberMapping: state.secureSendPhoneNumberMapping,
      }
    case Actions.FETCH_VERIFICATION_STATE:
      return {
        ...state,
        verificationState: {
          ...initialState.verificationState,
          isLoading: true,
        },
      }
    case Actions.UPDATE_VERIFICATION_STATE:
      return {
        ...state,
        verificationState: {
          lastFetch: Date.now(),
          isLoading: false,
          ...action.state,
        },
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
export const secureSendPhoneNumberMappingSelector = (state: RootState) =>
  state.identity.secureSendPhoneNumberMapping
export const importContactsProgressSelector = (state: RootState) =>
  state.identity.importContactsProgress
export const matchedContactsSelector = (state: RootState) => state.identity.matchedContacts

export const isBalanceSufficientForSigRetrievalSelector = (state: RootState) => {
  const dollarBalance = stableTokenBalanceSelector(state) || 0
  const celoBalance = celoTokenBalanceSelector(state) || 0
  return isBalanceSufficientForSigRetrieval(dollarBalance, celoBalance)
}

function isBalanceSufficientForAttestations(state: RootState, attestationsRemaining: number) {
  const userBalance = stableTokenBalanceSelector(state) || 0
  return new BigNumber(userBalance).isGreaterThan(
    attestationsRemaining * ESTIMATED_COST_PER_ATTESTATION
  )
}

const identityVerificationStateSelector = (state: RootState) => state.identity.verificationState

const isBalanceSufficientSelector = (state: RootState) => {
  const verificationState = state.identity.verificationState
  const { phoneHashDetails, status, actionableAttestations } = verificationState
  const attestationsRemaining = status.numAttestationsRemaining - actionableAttestations.length
  const isBalanceSufficient = !phoneHashDetails.phoneHash
    ? isBalanceSufficientForSigRetrievalSelector(state)
    : isBalanceSufficientForAttestations(state, attestationsRemaining)

  return isBalanceSufficient
}

export const verificationStateSelector = createSelector(
  identityVerificationStateSelector,
  isBalanceSufficientSelector,
  (verificationState, isBalanceSufficient): VerificationState => ({
    ...verificationState,
    isBalanceSufficient,
  })
)

export const isVerificationStateExpiredSelector = (state: RootState) => {
  return (
    !state.identity.verificationState.lastFetch ||
    timeDeltaInSeconds(Date.now(), state.identity.verificationState.lastFetch) >
      VERIFICATION_STATE_EXPIRY_SECONDS
  )
}
