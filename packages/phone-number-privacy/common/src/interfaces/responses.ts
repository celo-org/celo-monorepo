import * as t from 'io-ts'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  MatchmakingRequest,
  OdisRequest,
  PhoneNumberPrivacyRequest,
  PnpQuotaRequest,
  SignMessageRequest,
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

export type PhoneNumberPrivacyResponse<
  R extends PhoneNumberPrivacyRequest = PhoneNumberPrivacyRequest
> = R extends SignMessageRequest
  ? SignMessageResponse
  : never | R extends MatchmakingRequest
  ? GetContactMatchesResponse
  : never | R extends PnpQuotaRequest
  ? GetQuotaResponse
  : never

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

// export type DomainResponse<
//   R extends DomainRequest = DomainRequest
// > = R extends DomainRestrictedSignatureRequest
//   ? DomainRestrictedSignatureResponse
//   : never | R extends DomainQuotaStatusRequest<infer D>
//   ? DomainQuotaStatusResponse<D>
//   : never | R extends DisableDomainRequest
//   ? DisableDomainResponse
//   : never

export type DomainResponse<
  R extends DomainRequest = DomainRequest
> = R extends DomainRestrictedSignatureRequest
  ? DomainRestrictedSignatureResponse
  : never | R extends DomainQuotaStatusRequest<infer D>
  ? DomainQuotaStatusResponse<D> | DisableDomainResponse // @victor I was seeing some weirdness here bc the types have the same structure
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

export type OdisResponse<R extends OdisRequest = OdisRequest> = R extends DomainRequest
  ? DomainResponse<R>
  : never | R extends PhoneNumberPrivacyRequest
  ? PhoneNumberPrivacyResponse<R>
  : never

export type SuccessResponse<R extends OdisRequest> = OdisResponse<R> & { success: true }

export type FailureResponse<R extends OdisRequest = OdisRequest> = OdisResponse<R> & {
  success: false
}
