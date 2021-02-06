import { ActionableAttestation } from '@celo/contractkit/src/wrappers/Attestations'
import { AttestationsStatus } from '@celo/utils/src/attestations'
import { createAction, createReducer } from '@reduxjs/toolkit'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { RootState } from 'src/redux/reducers'

export const setKomenciContext = createAction<Partial<KomenciContext>>('SET_KOMENCI_CONTEXT')

export const start = createAction<{ e164Number: string; withoutRevealing: boolean }>('START')
export const stop = createAction('STOP')
export const enableKomenci = createAction('ENABLE_KOMENCI')
export const disableKomenci = createAction('DISABLE_KOMENCI')
export const ensureRealHumanUser = createAction('ENSURE_REAL_HUMAN_USER')
export const startKomenciSession = createAction('START_KOMENCI_SESSION')
export const fetchPhoneNumberDetails = createAction('FETCH_PHONE_NUMBER')
export const fetchMtw = createAction('FETCH_MTW')
export const fetchOnChainData = createAction('FETCH_ON_CHAIN_DATA')
export const fail = createAction<string>('FAIL')
export const succeed = createAction('SUCCEED')
export const doVerificationFlow = createAction<boolean>('DO_VERIFICATION_FLOW')

export const setPhoneHash = createAction<string>('SET_PHONE_HASH')
export const setVerificationStatus = createAction<Partial<AttestationsStatus>>(
  'SET_VERIFICATION_STATUS'
)

export const setActionableAttestation = createAction<ActionableAttestation[]>(
  'SET_ACTIONABLE_ATTESTATIONS'
)

export enum StateType {
  Idle = 'Idle',
  Preparing = 'Preparing',
  EnsuringRealHumanUser = 'EnsuringRealHumanUser',
  StartingKomenciSession = 'StartingKomenciSession',
  FetchingPhoneNumberDetails = 'FetchingPhoneNumberDetails',
  FetchingMtw = 'FetchingMtw',
  FetchingOnChainData = 'FetchingOnChainData',
  Error = 'Error',
}

// Idle State
interface Idle {
  type: StateType.Idle
}
export const idle = (): Idle => ({ type: StateType.Idle })

// PreparingKomenci State
interface Preparing {
  type: StateType.Preparing
}
// {}: Omit<PreparingKomenci, 'type'>
export const preparing = (): Preparing => ({
  type: StateType.Preparing,
})

// EnsuringRealHumanUser State
interface EnsuringRealHumanUser {
  type: StateType.EnsuringRealHumanUser
}
export const ensuringRealHumanUser = (): EnsuringRealHumanUser => ({
  type: StateType.EnsuringRealHumanUser,
})

// StartingKomenciSession State
interface StartingKomenciSession {
  type: StateType.StartingKomenciSession
}
export const startingKomenciSession = (): StartingKomenciSession => ({
  type: StateType.StartingKomenciSession,
})

// FetchingPhoneNumberDetails State
interface FetchingPhoneNumberDetails {
  type: StateType.FetchingPhoneNumberDetails
}
export const fetchingPhoneNumberDetails = (): FetchingPhoneNumberDetails => ({
  type: StateType.FetchingPhoneNumberDetails,
})

// FetchingMtw State
interface FetchingMtw {
  type: StateType.FetchingMtw
}
export const fetchingMtw = (): FetchingMtw => ({
  type: StateType.FetchingMtw,
})

// FetchingVerificationOnChain State
interface FetchingOnChainData {
  type: StateType.FetchingOnChainData
}
export const fetchingOnChainData = (): FetchingOnChainData => ({
  type: StateType.FetchingOnChainData,
})

// Error State
interface Error {
  type: StateType.Error
  message: string
}
export const error = (message: string): Error => ({
  type: StateType.Error,
  message,
})

type InternalState =
  | Idle
  | Preparing
  | EnsuringRealHumanUser
  | StartingKomenciSession
  | FetchingPhoneNumberDetails
  | FetchingMtw
  | FetchingOnChainData
  | Error

export interface KomenciContext {
  errorTimestamps: number[]
  unverifiedMtwAddress: string | null
  sessionActive: boolean
  sessionToken: string
  callbackUrl: string | undefined
  captchaToken: string
  pepperFetchedByKomenci: boolean
}

export interface State {
  status: AttestationsStatus
  actionableAttestations: ActionableAttestation[]
  currentState: InternalState
  komenci: KomenciContext
  komenciDisabled: boolean
  phoneHash?: string
  e164Number?: string
  retries: number
  eoaAccount?: string
}

const initialState: State = {
  komenci: {
    errorTimestamps: [],
    unverifiedMtwAddress: null,
    sessionActive: false,
    sessionToken: '',
    callbackUrl: undefined,
    captchaToken: '',
    pepperFetchedByKomenci: false,
  },
  status: {
    isVerified: false,
    numAttestationsRemaining: NUM_ATTESTATIONS_REQUIRED,
    total: 0,
    completed: 0,
  },
  actionableAttestations: [],
  retries: 0,
  currentState: idle(),
  komenciDisabled: false,
}

export const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(stop, (state, action) => {
      return { ...state, currentState: idle() }
    })
    .addCase(start, (state, action) => {
      return {
        ...state,
        e164Number: action.payload.e164Number,
        currentState: preparing(),
      }
    })
    .addCase(ensureRealHumanUser, (state, action) => {
      return {
        ...state,
        currentState: ensuringRealHumanUser(),
      }
    })
    .addCase(startKomenciSession, (state, action) => {
      return {
        ...state,
        currentState: startingKomenciSession(),
      }
    })
    .addCase(fetchPhoneNumberDetails, (state, action) => {
      return {
        ...state,
        currentState: fetchingPhoneNumberDetails(),
      }
    })
    .addCase(enableKomenci, (state, action) => {
      return {
        ...state,
        komenciDisabled: false,
        komenci: initialState.komenci,
      }
    })
    .addCase(disableKomenci, (state, action) => {
      return {
        ...state,
        komenciDisabled: true,
        komenci: initialState.komenci,
      }
    })
    .addCase(setPhoneHash, (state, action) => {
      return {
        ...state,
        phoneHash: action.payload,
      }
    })
    .addCase(fetchMtw, (state, action) => {
      return {
        ...state,
        currentState: fetchingMtw(),
      }
    })
    .addCase(fetchOnChainData, (state, action) => {
      return {
        ...state,
        currentState: fetchingOnChainData(),
      }
    })
    .addCase(setVerificationStatus, (state, action) => {
      return {
        ...state,
        status: {
          ...state.status,
          ...action.payload,
        },
      }
    })
    .addCase(setKomenciContext, (state, action) => {
      return {
        ...state,
        komenci: {
          ...state.komenci,
          ...action.payload,
        },
      }
    })
    .addCase(setActionableAttestation, (state, action) => {
      return {
        ...state,
        actionableAttestations: action.payload,
      }
    })
})

export const currentStateSelector = (state: RootState) => state.verify.currentState
export const e164NumberSelector = (state: RootState) => state.verify.e164Number
export const phoneHashSelector = (state: RootState) => state.verify.phoneHash
export const komenciContextSelector = (state: RootState) => state.verify.komenci
export const eoaAccountSelector = (state: RootState) => state.verify.eoaAccount
export const useKomenciSelector = (state: RootState) => !state.verify.komenciDisabled
export const verificationStatusSelector = (state: RootState): AttestationsStatus =>
  state.verify.status
export const actionableAttestationsSelector = (state: RootState): ActionableAttestation[] =>
  state.verify.actionableAttestations
