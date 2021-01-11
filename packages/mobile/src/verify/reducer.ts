import { createAction } from '@reduxjs/toolkit'
import { RootState } from 'src/redux/reducers'

export const prepare = createAction('PREPARE')
export const disableKomenci = createAction('DISABLE_KOMENCI')

type ActionTypes = typeof prepare | typeof disableKomenci

export enum StateType {
  Idle = 'Idle',
  PreparingKomenci = 'PreparingKomenci',
  EnsuringRealHumanUser = 'EnsuringRealHumanUser',
  StartingKomenciSession = 'StartingKomenciSession',
  FetchingPhoneNumberDetails = 'FetchingPhoneNumberDetails',
  PreparingMtw = 'PreparingMtw',
  FetchingVerificationOnChain = 'FetchingVerificationOnChain',
  FetchingActionableAttestations = 'FetchingActionableAttestations',
  Error = 'Error',
}

// Idle State
interface Idle {
  type: StateType.Idle
}
export const idle = (): Idle => ({ type: StateType.Idle })

// PreparingKomenci State
interface PreparingKomenci {
  type: StateType.PreparingKomenci
}
// {}: Omit<PreparingKomenci, 'type'>
export const preparingKomenci = (): PreparingKomenci => ({
  type: StateType.PreparingKomenci,
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

// PreparingMtw State
interface PreparingMtw {
  type: StateType.PreparingMtw
}
export const PreparingMtw = (): PreparingMtw => ({
  type: StateType.PreparingMtw,
})

// FetchingVerificationOnChain State
interface FetchingVerificationOnChain {
  type: StateType.FetchingVerificationOnChain
}
export const fetchingVerificationOnChain = (): FetchingVerificationOnChain => ({
  type: StateType.FetchingVerificationOnChain,
})

// FetchingActionableAttestations State
interface FetchingActionableAttestations {
  type: StateType.FetchingActionableAttestations
}
export const fetchingActionableAttestations = (): FetchingActionableAttestations => ({
  type: StateType.FetchingActionableAttestations,
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
  | PreparingKomenci
  | EnsuringRealHumanUser
  | StartingKomenciSession
  | FetchingPhoneNumberDetails
  | FetchingActionableAttestations
  | Error

export interface State {
  isKomenciEnabled: boolean
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
  pepper?: string
  phoneHash?: string
  retries: number
  currentState: InternalState
}

const initialState: State = {
  isKomenciEnabled: true,
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
  retries: 0,
  currentState: idle(),
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  const { isKomenciEnabled } = state
  switch (action.type) {
    case prepare.type: {
      return { ...state, currentState: isKomenciEnabled ? preparingKomenci() : idle() }
    }
    case disableKomenci.type: {
      return {
        ...state,
        currentState: fetchingPhoneNumberDetails(),
        komenci: { ...state.komenci, serviceAvailable: false },
      }
    }
    default:
      return state
  }
}

export const currentStateSelector = (state: RootState) => state.verify.currentState
export const komenciContextSelector = (state: RootState) => state.verify.komenci
