import * as t from 'io-ts'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
} from '.'
import { Domain, DomainState } from '../domains'

// Phone Number Privacy

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
  error: string
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
  error: string
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
  error: string
}

export type GetContactMatchesResponse =
  | GetContactMatchesResponseSuccess
  | GetContactMatchesResponseFailure

// Domains

export interface DomainRestrictedSignatureResponseSuccess<D extends Domain = Domain> {
  success: true
  version: string
  signature: string
  status: DomainState<D>
}

export interface DomainRestrictedSignatureResponseFailure<D extends Domain = Domain> {
  success: false
  version: string
  error: string
  status: DomainState<D>
}

export type DomainRestrictedSignatureResponse<D extends Domain = Domain> =
  | DomainRestrictedSignatureResponseSuccess<D>
  | DomainRestrictedSignatureResponseFailure<D>

export interface DomainQuotaStatusResponseSuccess<D extends Domain = Domain> {
  success: true
  version: string
  status: DomainState<D>
}

export interface DomainQuotaStatusResponseFailure {
  success: false
  version: string
  error: string
}

export type DomainQuotaStatusResponse<D extends Domain = Domain> =
  | DomainQuotaStatusResponseSuccess<D>
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

export type DomainResponse<
  R extends DomainRequest = DomainRequest
> = R extends DomainRestrictedSignatureRequest
  ? DomainRestrictedSignatureResponse
  : never | R extends DomainQuotaStatusRequest<infer D>
  ? DomainQuotaStatusResponse<D>
  : never | R extends DisableDomainRequest
  ? DisableDomainResponse
  : never

export function domainRestrictedSignatureResponseSchema<D extends Domain>(
  state: t.Type<DomainState<D>>
): t.Type<DomainRestrictedSignatureResponse<D>> {
  return t.union([
    t.type({
      success: t.literal(true),
      version: t.string,
      signature: t.string,
      status: state,
    }),
    t.type({
      success: t.literal(false),
      version: t.string,
      error: t.string,
      status: state,
    }),
  ])
}

export function domainQuotaStatusResponseSchema<D extends Domain>(
  state: t.Type<DomainState<D>>
): t.Type<DomainQuotaStatusResponse<D>> {
  return t.union([
    t.type({
      success: t.literal(true),
      version: t.string,
      status: state,
    }),
    t.type({
      success: t.literal(false),
      version: t.string,
      error: t.string,
    }),
  ])
}

export const DisableDomainResponseSchema: t.Type<DisableDomainResponse> = t.union([
  t.type({
    success: t.literal(true),
    version: t.string,
  }),
  t.type({
    success: t.literal(false),
    version: t.string,
    error: t.string,
  }),
])

// General

export type FailureResponse<D extends Domain = Domain> =
  | SignMessageResponseFailure
  | GetQuotaResponseFailure
  | GetContactMatchesResponseFailure
  | DomainRestrictedSignatureResponseFailure<D>
  | DomainQuotaStatusResponseFailure
  | DisableDomainResponseFailure

export type SuccessResponse<D extends Domain = Domain> =
  | SignMessageResponseSuccess
  | GetQuotaResponseSuccess
  | GetContactMatchesResponseSuccess
  | DomainRestrictedSignatureResponseSuccess<D>
  | DomainQuotaStatusResponseSuccess
  | DisableDomainResponseSuccess

export type OdisResponse<D extends Domain = Domain> = SuccessResponse<D> | FailureResponse<D>
