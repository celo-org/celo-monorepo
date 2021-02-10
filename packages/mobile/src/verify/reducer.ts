import { ActionableAttestation } from '@celo/contractkit/src/wrappers/Attestations'
import { AttestationsStatus } from '@celo/utils/src/attestations'
import { createAction, createReducer } from '@reduxjs/toolkit'
import { RootState } from 'src/redux/reducers'

import { isBalanceSufficientForSigRetrieval } from '@celo/identity/lib/odis/phone-number-identifier'
import BigNumber from 'bignumber.js'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

const ESTIMATED_COST_PER_ATTESTATION = 0.051

const rehydrate = createAction<any>(REHYDRATE)

export const setKomenciContext = createAction<Partial<KomenciContext>>('VERIFY/SET_KOMENCI_CONTEXT')
export const setOverrideWithoutVerification = createAction<boolean | undefined>(
  'VERIFY/SET_OVERRIDE_WITHOUT_VERIFICATION'
)
export const checkIfKomenciAvailable = createAction('VERIFY/CHECK_IF_KOMENCI_AVAILABLE')
export const setKomenciAvailable = createAction<boolean>('VERIFY/SET_KOMENCI_AVAILABLE')
export const start = createAction<{ e164Number: string; withoutRevealing: boolean }>('VERIFY/START')
export const stop = createAction('VERIFY/STOP')
export const setUseKomenci = createAction<boolean>('VERIFY/SET_USE_KOMENCI')
export const ensureRealHumanUser = createAction('VERIFY/ENSURE_REAL_HUMAN_USER')
export const startKomenciSession = createAction('VERIFY/START_KOMENCI_SESSION')
export const fetchPhoneNumberDetails = createAction('VERIFY/FETCH_PHONE_NUMBER')
export const fetchMtw = createAction('VERIFY/FETCH_MTW')
export const fetchOnChainData = createAction('VERIFY/FETCH_ON_CHAIN_DATA')
export const fail = createAction<string>('VERIFY/FAIL')
export const succeed = createAction('VERIFY/SUCCEED')
export const doVerificationFlow = createAction<boolean>('VERIFY/DO_VERIFICATION_FLOW')
export const reset = createAction<{ komenci: boolean }>('VERIFY/RESET')
export const setPhoneHash = createAction<string>('VERIFY/SET_PHONE_HASH')
export const setVerificationStatus = createAction<Partial<AttestationsStatus>>(
  'VERIFY/SET_VERIFICATION_STATUS'
)
export const setActionableAttestation = createAction<ActionableAttestation[]>(
  'VERIFY/SET_ACTIONABLE_ATTESTATIONS'
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
}

export interface State {
  status: AttestationsStatus & { komenci: boolean }
  actionableAttestations: ActionableAttestation[]
  currentState: InternalState
  komenci: KomenciContext
  komenciAvailable: boolean | undefined
  phoneHash?: string
  e164Number?: string
  retries: number
  TEMPORAR_override_withoutVerification?: boolean
}

const initialState: State = {
  komenci: {
    errorTimestamps: [],
    unverifiedMtwAddress: null,
    sessionActive: false,
    sessionToken: '',
    callbackUrl: undefined,
    captchaToken: '',
  },
  status: {
    isVerified: false,
    numAttestationsRemaining: 3,
    total: 0,
    completed: 0,
    komenci: true,
  },
  actionableAttestations: [],
  retries: 0,
  currentState: idle(),
  komenciAvailable: undefined,
  TEMPORAR_override_withoutVerification: undefined,
}

export const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(rehydrate, (state, action) => {
      // hack to allow rehydrate actions here
      const hydrated = getRehydratePayload((action as unknown) as RehydrateAction, 'verify')
      return {
        ...state,
        ...hydrated,
        komenci: {
          ...state.komenci,
          ...hydrated.komenci,
          captchaToken: initialState.komenci.captchaToken,
        },
        retries: 0,
        currentState: idle(),
      }
    })
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
    .addCase(setUseKomenci, (state, action) => {
      return {
        ...state,
        shouldUseKomenci: action.payload,
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
    .addCase(setOverrideWithoutVerification, (state, action) => {
      return {
        ...state,
        TEMPORAR_override_withoutVerification: action.payload,
      }
    })
    .addCase(checkIfKomenciAvailable, (state) => {
      return {
        ...state,
        komenciAvailable: undefined,
      }
    })
    .addCase(setKomenciAvailable, (state, action) => {
      return {
        ...state,
        komenciAvailable: action.payload,
      }
    })
    .addCase(reset, (state, action) => {
      return {
        ...initialState,
        e164Number: state.e164Number,
        status: {
          ...initialState.status,
          komenci: action.payload.komenci,
        },
        komenciAvailable: action.payload.komenci,
      }
    })
})

const isBalanceSufficientForAttestations = (state: RootState, attestationsRemaining: number) => {
  const userBalance = stableTokenBalanceSelector(state) || 0
  return new BigNumber(userBalance).isGreaterThan(
    attestationsRemaining * ESTIMATED_COST_PER_ATTESTATION
  )
}

export const currentStateSelector = (state: RootState) => state.verify.currentState
export const e164NumberSelector = (state: RootState) => state.verify.e164Number
export const phoneHashSelector = (state: RootState) => state.verify.phoneHash
export const komenciContextSelector = (state: RootState) => state.verify.komenci
export const shouldUseKomenciSelector = (state: RootState) => {
  if (state.verify.komenciAvailable === undefined) {
    return undefined
  }
  const verificationHasStarted = state.verify.status.completed > 0
  // Only use Komenci when verification has not started with classic flow
  return state.verify.komenciAvailable && !(verificationHasStarted && !state.verify.status.komenci)
}

export const verificationStatusSelector = (state: RootState) => state.verify.status
export const actionableAttestationsSelector = (state: RootState): ActionableAttestation[] =>
  state.verify.actionableAttestations
export const overrideWithoutVerificationSelector = (state: RootState): boolean | undefined =>
  state.verify.TEMPORAR_override_withoutVerification

export const isBalanceSufficientForSigRetrievalSelector = (state: RootState) => {
  const dollarBalance = stableTokenBalanceSelector(state) || 0
  const celoBalance = celoTokenBalanceSelector(state) || 0
  return isBalanceSufficientForSigRetrieval(dollarBalance, celoBalance)
}

// TODO: rewrite using reselect
export const isBalanceSufficientSelector = (state: RootState) => {
  const actionableAttestations = actionableAttestationsSelector(state)
  const { numAttestationsRemaining } = verificationStatusSelector(state)
  const attestationsRemaining = numAttestationsRemaining - actionableAttestations.length
  const phoneHash = phoneHashSelector(state)
  const isBalanceSufficient = !phoneHash
    ? isBalanceSufficientForSigRetrievalSelector(state)
    : isBalanceSufficientForAttestations(state, attestationsRemaining)

  return isBalanceSufficient
}
