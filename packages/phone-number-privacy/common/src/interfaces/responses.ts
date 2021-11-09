import { KnownDomainState } from '../../src/domains'

export interface SignMessageResponse {
  success: boolean
  version?: string
  signature?: string
  performedQueryCount?: number
  totalQuota?: number
  blockNumber?: number
}

export interface SignMessageResponseFailure extends SignMessageResponse {
  success: false
  error: string
}

export interface SignMessageResponseSuccess extends SignMessageResponse {
  success: true
}

export interface GetQuotaResponse {
  success: boolean
  version: string
  performedQueryCount: number
  totalQuota: number
}

export interface GetContactMatchesResponse {
  success: boolean
  matchedContacts: Array<{
    phoneNumber: string
  }>
  version: string
}

export interface DomainRestrictedSignatureResponseSuccess {
  success: true
  version: string
  signature: string
}

export interface DomainRestrictedSignatureResponseFailure {
  success: false
  version: string
  error: string
}

export type DomainRestrictedSignatureResponse =
  | DomainRestrictedSignatureResponseSuccess
  | DomainRestrictedSignatureResponseFailure

export interface DomainQuotaStatusResponseSuccess {
  success: true
  version: string
  status: KnownDomainState
}

export interface DomainQuotaStatusResponseFailure {
  success: false
  version: string
  error: string
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
  error: string
}

export type DisableDomainResponse = DisableDomainResponseSuccess | DisableDomainResponseFailure
