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
  signature: string
  performedQueryCount: number | undefined
  totalQuota: number | undefined
  blockNumber: number | undefined
  warnings: string[] | undefined
}

export interface SignMessageResponseFailure {
  success: false
  version: string
  error: string
  performedQueryCount: number | undefined
  totalQuota: number | undefined
  blockNumber: number | undefined
}

export type SignMessageResponse = SignMessageResponseSuccess | SignMessageResponseFailure

export const SignMessageResponseSchema: t.Type<SignMessageResponse> = t.union([
  t.type({
    success: t.literal(true),
    version: t.string,
    signature: t.string,
    performedQueryCount: t.union([t.number, t.undefined]),
    totalQuota: t.union([t.number, t.undefined]),
    blockNumber: t.union([t.number, t.undefined]),
    warnings: t.union([t.array(t.string), t.undefined]),
  }),
  t.type({
    success: t.literal(false),
    version: t.string,
    error: t.string,
    performedQueryCount: t.union([t.number, t.undefined]),
    totalQuota: t.union([t.number, t.undefined]),
    blockNumber: t.union([t.number, t.undefined]),
  }),
])

export interface PnpQuotaResponseSuccess {
  success: true
  version: string
  performedQueryCount: number | undefined
  totalQuota: number | undefined
  blockNumber: number | undefined
  warnings: string[] | undefined
}

export interface PnpQuotaResponseFailure {
  success: false
  version: string
  error: string
}

export type PnpQuotaResponse = PnpQuotaResponseSuccess | PnpQuotaResponseFailure

export const PnpQuotaResponseSchema: t.Type<PnpQuotaResponse> = t.union([
  t.type({
    success: t.literal(true),
    version: t.string,
    performedQueryCount: t.union([t.number, t.undefined]),
    totalQuota: t.union([t.number, t.undefined]),
    blockNumber: t.union([t.number, t.undefined]),
    warnings: t.union([t.array(t.string), t.undefined]),
  }),
  t.type({
    success: t.literal(false),
    version: t.string,
    error: t.string,
  }),
])

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

export const GetContactMatchesResponseSchema: t.Type<GetContactMatchesResponse> = t.union([
  t.type({
    success: t.literal(true),
    version: t.string,
    matchedContacts: t.array(t.type({ phoneNumber: t.string })),
  }),
  t.type({
    success: t.literal(false),
    version: t.string,
    error: t.string,
  }),
])

// prettier-ignore
export type PhoneNumberPrivacyResponse<
  R extends PhoneNumberPrivacyRequest = PhoneNumberPrivacyRequest
> =
  | R extends SignMessageRequest ? SignMessageResponse : never
  | R extends MatchmakingRequest ? GetContactMatchesResponse : never
  | R extends PnpQuotaRequest ? PnpQuotaResponse : never

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
  status: DomainState<D> | undefined
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

// prettier-ignore
export type DomainResponse<
  R extends DomainRequest = DomainRequest
> = 
  | R extends DomainRestrictedSignatureRequest<infer D> ? DomainRestrictedSignatureResponse<D> : never
  // tslint:disable-next-line: no-shadowed-variable
  | R extends DomainQuotaStatusRequest<infer D> ? DomainQuotaStatusResponse<D> : never
  | R extends DisableDomainRequest ? DisableDomainResponse : never

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
      status: t.union([state, t.undefined]),
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

// prettier-ignore
export type OdisResponse<R extends OdisRequest = OdisRequest> =
  | R extends DomainRequest ? DomainResponse<R> : never
  | R extends PhoneNumberPrivacyRequest ? PhoneNumberPrivacyResponse<R> : never

export type SuccessResponse<R extends OdisRequest = OdisRequest> = OdisResponse<R> & {
  success: true
}

export type FailureResponse<R extends OdisRequest = OdisRequest> = OdisResponse<R> & {
  success: false
}
