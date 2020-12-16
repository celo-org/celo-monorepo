import { ActionableAttestation } from '@celo/contractkit/lib/wrappers/Attestations'
import {
  isBalanceSufficientForSigRetrieval,
  PhoneNumberHashDetails,
} from '@celo/identity/lib/odis/phone-number-identifier'
import { AttestationsStatus } from '@celo/utils/src/attestations'
import BigNumber from 'bignumber.js'
import dotProp from 'dot-prop-immutable'
import { RehydrateAction } from 'redux-persist'
import { createSelector } from 'reselect'
import { Actions as AccountActions, ClearStoredAccountAction } from 'src/account/actions'
import { VERIFICATION_STATE_EXPIRY_SECONDS } from 'src/config'
import { features } from 'src/flags'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { Actions, ActionTypes } from 'src/identity/actions'
import { hasExceededKomenciErrorQuota } from 'src/identity/feelessVerificationErrors'
import { ContactMatches, ImportContactsStatus, VerificationStatus } from 'src/identity/types'
import { removeKeyFromMapping } from 'src/identity/utils'
import {
  AttestationCode,
  ESTIMATED_COST_PER_ATTESTATION,
  NUM_ATTESTATIONS_REQUIRED,
} from 'src/identity/verification'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Actions as SendActions, StoreLatestInRecentsAction } from 'src/send/actions'
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

export interface AddressInfoToDisplay {
  name: string
  imageUrl: string | null
}

export interface AddressToDisplayNameType {
  [address: string]: AddressInfoToDisplay | undefined
}

export interface WalletToAccountAddressType {
  [address: string]: string
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

export type FeelessUpdatableVerificationState = {
  isActive: boolean
  komenci: {
    errorTimestamps: number[]
    unverifiedMtwAddress: string | null
    serviceAvailable: boolean
    sessionActive: boolean
    sessionToken: string
    callbackUrl: string | undefined
    captchaToken: string
    pepperFetchedByKomenci: boolean
  }
} & UpdatableVerificationState

export type VerificationState = State['verificationState'] & {
  isBalanceSufficient: boolean
}

export type FeelessVerificationState = {
  isLoading: boolean
  lastFetch: number | null
} & FeelessUpdatableVerificationState

export interface State {
  attestationCodes: AttestationCode[]
  feelessAttestationCodes: AttestationCode[]
  feelessProcessingInputCode: boolean
  // we store acceptedAttestationCodes to tell user if code
  // was already used even after Actions.RESET_VERIFICATION
  acceptedAttestationCodes: AttestationCode[]
  feelessAcceptedAttestationCodes: AttestationCode[]
  // numCompleteAttestations is controlled locally
  numCompleteAttestations: number
  feelessNumCompleteAttestations: number
  verificationStatus: VerificationStatus
  feelessVerificationStatus: VerificationStatus
  hasSeenVerificationNux: boolean
  addressToE164Number: AddressToE164NumberType
  // Note: Do not access values in this directly, use the `getAddressFromPhoneNumber` helper in contactMapping
  e164NumberToAddress: E164NumberToAddressType
  // This contains a mapping of walletAddress (EOA) to accountAddress (either MTW or EOA)
  // and is needed to query for a user's DEK while knowing only their walletAddress
  walletToAccountAddress: WalletToAccountAddressType
  e164NumberToSalt: E164NumberToSaltType
  addressToDataEncryptionKey: AddressToDataEncryptionKeyType
  // Doesn't contain all known addresses, use only as a fallback.
  // TODO: Remove if unused after CIP-8 implementation.
  addressToDisplayName: AddressToDisplayNameType
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
  feelessVerificationState: FeelessVerificationState
  lastRevealAttempt: number | null
  feelessLastRevealAttempt: number | null
}

const initialState: State = {
  attestationCodes: [],
  feelessAttestationCodes: [],
  feelessProcessingInputCode: false,
  acceptedAttestationCodes: [],
  feelessAcceptedAttestationCodes: [],
  numCompleteAttestations: 0,
  feelessNumCompleteAttestations: 0,
  verificationStatus: VerificationStatus.Stopped,
  feelessVerificationStatus: VerificationStatus.Stopped,
  hasSeenVerificationNux: false,
  addressToE164Number: {},
  e164NumberToAddress: {},
  walletToAccountAddress: {},
  e164NumberToSalt: {},
  addressToDataEncryptionKey: {},
  addressToDisplayName: {},
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
  feelessVerificationState: {
    isLoading: false,
    isActive: false,
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
    komenci: {
      errorTimestamps: [],
      unverifiedMtwAddress: null,
      serviceAvailable: false,
      sessionActive: false,
      sessionToken: '',
      callbackUrl: undefined,
      captchaToken: '',
      pepperFetchedByKomenci: false,
    },
  },
  lastRevealAttempt: null,
  feelessLastRevealAttempt: null,
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | ClearStoredAccountAction | StoreLatestInRecentsAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      const rehydratedState = getRehydratePayload(action, 'identity')
      return {
        ...state,
        ...rehydratedState,
        verificationStatus: VerificationStatus.Stopped,
        feelessVerificationStatus: VerificationStatus.Stopped,
        importContactsProgress: {
          status: ImportContactsStatus.Stopped,
          current: 0,
          total: 0,
        },
        verificationState: initialState.verificationState,
        feelessVerificationState: {
          ...initialState.feelessVerificationState,
          ...rehydratedState.feelessVerificationState,
          isLoading: false,
        },
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
    case Actions.FEELESS_RESET_VERIFICATION:
      return {
        ...state,
        feelessAttestationCodes: [],
        feelessProcessingInputCode: false,
        feelessNumCompleteAttestations: 0,
        feelessVerificationStatus: VerificationStatus.Stopped,
      }
    case Actions.REVOKE_VERIFICATION_STATE:
      return {
        ...state,
        attestationCodes: [],
        acceptedAttestationCodes: [],
        numCompleteAttestations: 0,
        verificationStatus: VerificationStatus.Stopped,
        verificationState: initialState.verificationState,
        lastRevealAttempt: null,
      }
    case Actions.FEELESS_REVOKE_VERIFICATION_STATE:
      return {
        ...state,
        feelessAttestationCodes: [],
        feelessProcessingInputCode: false,
        feelessAcceptedAttestationCodes: [],
        feelessNumCompleteAttestations: 0,
        feelessVerificationStatus: VerificationStatus.Stopped,
        walletToAccountAddress: removeKeyFromMapping(
          state.walletToAccountAddress,
          action.walletAddress
        ),
        feelessVerificationState: initialState.feelessVerificationState,
        feelessLastRevealAttempt: null,
      }
    case Actions.FEELESS_START_VERIFICATION:
      return {
        ...state,
        feelessVerificationState: {
          ...state.feelessVerificationState,
          isActive: true,
        },
      }
    case Actions.SET_VERIFICATION_STATUS:
      return {
        ...state,
        verificationStatus: action.status,
        verificationState: {
          ...state.verificationState,
          isLoading: action.status === VerificationStatus.GettingStatus,
        },
      }
    case Actions.FEELESS_SET_VERIFICATION_STATUS:
      return {
        ...state,
        feelessVerificationStatus: action.status,
        feelessVerificationState: {
          ...state.feelessVerificationState,
          isActive: action.status > 0 && action.status !== VerificationStatus.Done,
          isLoading: action.status === VerificationStatus.GettingStatus,
        },
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
    case Actions.FEELESS_SET_COMPLETED_CODES:
      return {
        ...state,
        ...feelessCompleteCodeReducer(state, action.numComplete),
      }
    case Actions.SET_CAPTCHA_TOKEN:
      return {
        ...state,
        feelessVerificationState: {
          ...state.feelessVerificationState,
          komenci: {
            ...state.feelessVerificationState.komenci,
            captchaToken: action.token,
          },
        },
      }
    case Actions.INPUT_ATTESTATION_CODE:
      return {
        ...state,
        attestationCodes: [...state.attestationCodes, action.code],
      }
    case Actions.FEELESS_INPUT_ATTESTATION_CODE:
      return {
        ...state,
        feelessAttestationCodes: [...state.feelessAttestationCodes, action.code],
      }
    case Actions.FEELESS_PROCESSING_INPUT_CODE:
      return {
        ...state,
        feelessProcessingInputCode: action.active,
      }
    case Actions.COMPLETE_ATTESTATION_CODE:
      return {
        ...state,
        numCompleteAttestations: state.numCompleteAttestations + 1,
        acceptedAttestationCodes: [...state.acceptedAttestationCodes, action.code],
      }
    case Actions.FEELESS_COMPLETE_ATTESTATION_CODE:
      return {
        ...state,
        feelessNumCompleteAttestations: state.feelessNumCompleteAttestations + 1,
        feelessAcceptedAttestationCodes: [...state.feelessAcceptedAttestationCodes, action.code],
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
    case Actions.UPDATE_WALLET_TO_ACCOUNT_ADDRESS:
      return {
        ...state,
        walletToAccountAddress: {
          ...state.walletToAccountAddress,
          ...action.walletToAccountAddress,
        },
      }
    case Actions.UPDATE_E164_PHONE_NUMBER_SALT:
      return {
        ...state,
        e164NumberToSalt: { ...state.e164NumberToSalt, ...action.e164NumberToSalt },
      }
    case SendActions.STORE_LATEST_IN_RECENTS:
      if (!action.recipient.address) {
        return state
      }
      action = {
        type: Actions.UPDATE_KNOWN_ADDRESSES,
        knownAddresses: {
          [action.recipient.address]: {
            name: action.recipient.displayName,
            imageUrl: null,
          },
        },
      }
    case Actions.UPDATE_KNOWN_ADDRESSES:
      return {
        ...state,
        addressToDisplayName: {
          ...state.addressToDisplayName,
          ...action.knownAddresses,
        },
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
    case Actions.FEELESS_FETCH_VERIFICATION_STATE:
      return {
        ...state,
        feelessVerificationState: {
          ...state.feelessVerificationState,
          isLoading: true,
        },
      }
    case Actions.UPDATE_VERIFICATION_STATE:
      return {
        ...state,
        verificationState: {
          lastFetch: Date.now(),
          isLoading: state.verificationState.isLoading,
          ...action.state,
        },
      }
    case Actions.FEELESS_UPDATE_VERIFICATION_STATE:
      return {
        ...state,
        feelessVerificationState: {
          lastFetch: Date.now(),
          isLoading: state.feelessVerificationState.isLoading,
          ...action.state,
        },
      }
    case Actions.SET_LAST_REVEAL_ATTEMPT:
      return {
        ...state,
        lastRevealAttempt: action.time,
      }
    case Actions.FEELESS_SET_LAST_REVEAL_ATTEMPT:
      return {
        ...state,
        feelessLastRevealAttempt: action.time,
      }
    default:
      return state
  }
}

const completeCodeReducer = (state: State, numCompleteAttestations: number) => {
  const { acceptedAttestationCodes } = state
  // Ensure numCompleteAttestations many codes are filled
  const attestationCodes = [...state.attestationCodes]
  for (let i = 0; i < numCompleteAttestations; i++) {
    attestationCodes[i] = acceptedAttestationCodes[i] || {
      code: ATTESTATION_CODE_PLACEHOLDER,
      issuer: ATTESTATION_ISSUER_PLACEHOLDER,
    }
  }
  return {
    numCompleteAttestations,
    attestationCodes,
  }
}

const feelessCompleteCodeReducer = (state: State, feelessNumCompleteAttestations: number) => {
  const { feelessAcceptedAttestationCodes } = state
  // Ensure numCompleteAttestations many codes are filled
  const feelessAttestationCodes = [...state.feelessAttestationCodes]
  for (let i = 0; i < feelessNumCompleteAttestations; i++) {
    feelessAttestationCodes[i] = feelessAcceptedAttestationCodes[i] || {
      code: ATTESTATION_CODE_PLACEHOLDER,
      issuer: ATTESTATION_ISSUER_PLACEHOLDER,
    }
  }
  return {
    feelessNumCompleteAttestations,
    feelessAttestationCodes,
  }
}

export const attestationCodesSelector = (state: RootState) => state.identity.attestationCodes
export const feelessAttestationCodesSelector = (state: RootState) =>
  state.identity.feelessAttestationCodes
export const feelessProcessingInputCodeSelector = (state: RootState) =>
  state.identity.feelessProcessingInputCode
export const acceptedAttestationCodesSelector = (state: RootState) =>
  state.identity.acceptedAttestationCodes
export const feelessAcceptedAttestationCodesSelector = (state: RootState) =>
  state.identity.feelessAcceptedAttestationCodes
export const e164NumberToAddressSelector = (state: RootState) => state.identity.e164NumberToAddress
export const addressToE164NumberSelector = (state: RootState) => state.identity.addressToE164Number
export const walletToAccountAddressSelector = (state: RootState) =>
  state.identity.walletToAccountAddress
export const addressToDataEncryptionKeySelector = (state: RootState) =>
  state.identity.addressToDataEncryptionKey
export const e164NumberToSaltSelector = (state: RootState) => state.identity.e164NumberToSalt
export const secureSendPhoneNumberMappingSelector = (state: RootState) =>
  state.identity.secureSendPhoneNumberMapping
export const importContactsProgressSelector = (state: RootState) =>
  state.identity.importContactsProgress
export const matchedContactsSelector = (state: RootState) => state.identity.matchedContacts
export const addressToDisplayNameSelector = (state: RootState) =>
  state.identity.addressToDisplayName

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

export const feelessVerificationStateSelector = (state: RootState) =>
  state.identity.feelessVerificationState

export const isVerificationStateExpiredSelector = (state: RootState) => {
  return (
    !state.identity.verificationState.lastFetch ||
    timeDeltaInSeconds(Date.now(), state.identity.verificationState.lastFetch) >
      VERIFICATION_STATE_EXPIRY_SECONDS
  )
}

export const isFeelessVerificationStateExpiredSelector = (state: RootState) => {
  const { lastFetch } = state.identity.feelessVerificationState
  return !lastFetch || timeDeltaInSeconds(Date.now(), lastFetch) > VERIFICATION_STATE_EXPIRY_SECONDS
}

export const tryFeelessOnboardingSelector = ({
  identity: { feelessVerificationState },
}: RootState) => {
  const { errorTimestamps } = feelessVerificationState.komenci
  return !hasExceededKomenciErrorQuota(errorTimestamps) && features.KOMENCI
}
