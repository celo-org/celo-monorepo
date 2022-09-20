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
export interface PnpQuotaStatus {
  performedQueryCount: number
  // all time total quota
  totalQuota: number
  blockNumber?: number
}

const PnpQuotaStatusSchema: t.Type<PnpQuotaStatus> = t.intersection([
  t.type({
    performedQueryCount: t.number,
    totalQuota: t.number,
  }),
  t.partial({
    blockNumber: t.union([t.number, t.undefined]),
  }),
])

export interface SignMessageResponseSuccess extends PnpQuotaStatus {
  success: true
  version: string
  signature: string
  warnings?: string[]
  // TODO(2.0.0) audit req/res types - https://github.com/celo-org/celo-monorepo/issues/9804
  // - warnings not provided in 1.1.11
}

export interface SignMessageResponseFailure {
  success: false
  version: string
  error: string
  performedQueryCount?: number
  totalQuota?: number
  blockNumber?: number
  // TODO(2.0.0) audit req/res types - https://github.com/celo-org/celo-monorepo/issues/9804
  // - signature was previously optionally provided on failure, check sdk for backwards compatibility
}

export type SignMessageResponse = SignMessageResponseSuccess | SignMessageResponseFailure

export const SignMessageResponseSchema: t.Type<SignMessageResponse> = t.union([
  t.intersection([
    t.type({
      success: t.literal(true),
      version: t.string,
      signature: t.string,
    }),
    t.partial({
      warnings: t.union([t.array(t.string), t.undefined]),
    }),
    PnpQuotaStatusSchema,
  ]),
  t.intersection([
    t.type({
      success: t.literal(false),
      version: t.string,
      error: t.string,
    }),
    t.partial({
      performedQueryCount: t.union([t.number, t.undefined]),
      totalQuota: t.union([t.number, t.undefined]),
      blockNumber: t.union([t.number, t.undefined]),
    }),
  ]),
])

export interface PnpQuotaResponseSuccess extends PnpQuotaStatus {
  success: true
  version: string
  warnings?: string[]
}

export interface PnpQuotaResponseFailure {
  success: false
  version: string
  error: string
}

export type PnpQuotaResponse = PnpQuotaResponseSuccess | PnpQuotaResponseFailure

export const PnpQuotaResponseSchema: t.Type<PnpQuotaResponse> = t.union([
  t.intersection([
    t.type({
      success: t.literal(true),
      version: t.string,
    }),
    t.partial({
      warnings: t.union([t.array(t.string), t.undefined]),
    }),
    PnpQuotaStatusSchema,
  ]),
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
  status?: DomainState<D>
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

export interface DisableDomainResponseSuccess<D extends Domain = Domain> {
  success: true
  version: string
  status: DomainState<D>
}

export interface DisableDomainResponseFailure {
  success: false
  version: string
  error: string
  // TODO EN revisit if we ever pass in a domain status on failure
}

export type DisableDomainResponse<D extends Domain = Domain> =
  | DisableDomainResponseSuccess<D>
  | DisableDomainResponseFailure

// prettier-ignore
export type DomainResponse<
  R extends DomainRequest = DomainRequest
> = R extends DomainRestrictedSignatureRequest<infer D>
  ? DomainRestrictedSignatureResponse<D>
  : never | R extends DomainQuotaStatusRequest<infer D2>
  ? DomainQuotaStatusResponse<D2>
  : never | R extends DisableDomainRequest<infer D3>
  ? DisableDomainResponse<D3>
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
    t.intersection([
      t.type({
        success: t.literal(false),
        version: t.string,
        error: t.string,
      }),
      t.partial({
        status: t.union([state, t.undefined]),
      }),
    ]),
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

export function disableDomainResponseSchema<D extends Domain>(
  state: t.Type<DomainState<D>>
): t.Type<DisableDomainResponse<D>> {
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
