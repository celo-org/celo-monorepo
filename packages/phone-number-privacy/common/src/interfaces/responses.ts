import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  ErrorType,
} from '.'
import { KnownDomainState } from '../domains'

export interface SignMessageResponseSuccess {
  success: true
  version: string
  performedQueryCount?: number
  totalQuota?: number
  blockNumber?: number
  signature?: string
}

export interface SignMessageResponseFailure {
  success: false
  version: string
  performedQueryCount?: number
  totalQuota?: number
  blockNumber?: number
  signature?: string
}

export type SignMessageResponse = SignMessageResponseSuccess | SignMessageResponseFailure
export interface GetQuotaResponseSuccess {
  success: true
  version: string
  performedQueryCount?: number
  totalQuota?: number
  blockNumber?: number
}

export interface GetQuotaResponseFailure {
  success: false
  version: string
  error: ErrorType
}

export type GetQuotaResponse = GetQuotaResponseSuccess | GetQuotaResponseFailure

export interface GetContactMatchesResponseSuccess {
  success: true
  version: string
  matchedContacts: Array<{ phoneNumber: string }>
}
export interface GetContactMatchesResponseFailure {
  success: false
  version: string
  error: ErrorType
}

export type GetContactMatchesResponse =
  | GetContactMatchesResponseSuccess
  | GetContactMatchesResponseFailure

export interface DomainRestrictedSignatureResponseSuccess {
  successs: true
  version: string
  signature: string
}

export interface DomainRestrictedSignatureResponseFailure {
  success: false
  version: string
  status: KnownDomainState
  /** Server Unix tiimestamp in seconds */
  date: number
}

export type DomainRestrictedSignatureResponse =
  | DomainRestrictedSignatureResponseSuccess
  | DomainRestrictedSignatureResponseFailure

export interface DomainQuotaStatusResponseSuccess {
  success: true
  version: string
  status: KnownDomainState
  /** Server Unix tiimestamp in seconds */
  date: number
}

export interface DomainQuotaStatusResponseFailure {
  success: false
  version: string
  error: ErrorType
}

export type DomainQuotaStatusResponse =
  | DomainQuotaStatusResponseSuccess
  | DomainQuotaStatusResponseFailure

export interface DisableDomainResponseSuccess {
  success: true
  version: string
}

export interface DisableDomainResponseFailure {
  success: false
  version: string
  error: ErrorType
}

export type DisableDomainResponse = DisableDomainResponseSuccess | DisableDomainResponseFailure

export type DomainResponse<
  R extends DomainRequest = DomainRequest
> = R extends DomainRestrictedSignatureRequest
  ? DomainRestrictedSignatureResponse
  : never | R extends DomainQuotaStatusRequest
  ? DomainQuotaStatusResponse
  : never | R extends DisableDomainRequest
  ? DisableDomainResponse
  : never
