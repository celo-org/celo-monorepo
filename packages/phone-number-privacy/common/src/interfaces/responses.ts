import * as t from 'io-ts'
import { Domain, DomainState } from '../domains'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
} from './requests'

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

export type DomainResponse<R extends DomainRequest = DomainRequest> =
  R extends DomainRestrictedSignatureRequest
    ? DomainRestrictedSignatureResponse
    : never | R extends DomainQuotaStatusRequest<infer D>
    ? DomainQuotaStatusResponse<D>
    : never | R extends DisableDomainRequest
    ? DisableDomainResponse
    : never

export const DomainRestrictedSignatureResponseSchema: t.Type<DomainRestrictedSignatureResponse> =
  t.union([
    t.type({
      success: t.literal(true),
      version: t.string,
      signature: t.string,
    }),
    t.type({
      success: t.literal(false),
      version: t.string,
      error: t.string,
    }),
  ])

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
