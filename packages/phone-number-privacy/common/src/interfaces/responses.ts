import * as t from 'io-ts'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
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
}

const PnpQuotaStatusSchema: t.Type<PnpQuotaStatus> = t.type({
  performedQueryCount: t.number,
  totalQuota: t.number,
})

export interface SignMessageResponseSuccess extends PnpQuotaStatus {
  success: true
  version: string
  signature: string
  warnings?: string[]
}

export interface SignMessageResponseFailure {
  success: false
  version: string
  error: string
  // These fields are occasionally provided by the signer but not the combiner
  // because the combiner separates failure/success responses before processing states.
  // => If the signer response fails, then it's irrelevant if that signer returned quota values,
  // since these won't be used in the quota calculation anyways.
  // Changing this is more involved; TODO(future) https://github.com/celo-org/celo-monorepo/issues/9826
  performedQueryCount?: number
  totalQuota?: number
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

// prettier-ignore
export type PhoneNumberPrivacyResponse<
  R extends PhoneNumberPrivacyRequest = PhoneNumberPrivacyRequest
> =
  | R extends SignMessageRequest ? SignMessageResponse : never
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
}

export type DisableDomainResponse<D extends Domain = Domain> =
  | DisableDomainResponseSuccess<D>
  | DisableDomainResponseFailure

// prettier-ignore
export type DomainResponse<
  R extends DomainRequest = DomainRequest
> =
  | R extends DomainRestrictedSignatureRequest<infer D> ? DomainRestrictedSignatureResponse<D> : never
  | R extends DomainQuotaStatusRequest<infer D2> ? DomainQuotaStatusResponse<D2> : never
  | R extends DisableDomainRequest<infer D3> ? DisableDomainResponse<D3> : never

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
