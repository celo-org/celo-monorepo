import {
  EIP712Optional,
  eip712OptionalSchema,
  eip712OptionalType,
  EIP712TypedData,
  noString,
} from '@celo/utils/lib/sign-typed-data-utils'
import { verifyEIP712TypedDataSigner } from '@celo/utils/lib/signatureUtils'
import { chain, isRight } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import {
  Domain,
  domainEIP712Types,
  DomainOptions,
  domainOptionsEIP712Types,
  isSequentialDelayDomain,
  SequentialDelayDomain,
  SequentialDelayDomainOptionsSchema,
} from '../domains'

// Domain request types are only assignable to EIP712Object when using type instead
// of interface. Otherwise the compiler complains about a missing index signature.
// tslint:disable:interface-over-type-literal

export enum AuthenticationMethod {
  WALLET_KEY = 'wallet_key',
  ENCRYPTION_KEY = 'encryption_key',
}

// TODO(Alec): investigate alias in sdk/identity
export interface GetBlindedMessageSigRequest {
  /** Celo account address. Query is charged against this account's quota. */
  account: string
  /** Query message. A blinded elliptic curve point encoded in base64. */
  blindedQueryPhoneNumber: string
  /** Authentication method to use for verifying the signature in the Authorization header */
  authenticationMethod: string | undefined
  /** Optional on-chain identifier. Unlocks additional quota if the account is verified as an owner of the identifier. */
  hashedPhoneNumber: string | undefined
  /** Client-specified session ID for the request. */
  sessionID: string | undefined
  /** Client-specified version string */
  version: string | undefined
}
export declare type SignMessageRequest = GetBlindedMessageSigRequest

export const SignMessageRequestSchema: t.Type<SignMessageRequest> = t.type({
  account: t.string,
  blindedQueryPhoneNumber: t.string,
  authenticationMethod: t.union([t.string, t.undefined]),
  hashedPhoneNumber: t.union([t.string, t.undefined]),
  sessionID: t.union([t.string, t.undefined]),
  version: t.union([t.string, t.undefined]),
})

export interface GetContactMatchesRequest {
  /** Celo account address of the user */
  account: string
  /** User's phone number obfuscated with deterministic salt */
  userPhoneNumber: string
  /** User's contact list obfuscated with deterministic salt */
  contactPhoneNumbers: string[]
  /** User's ODIS generated on-chain identifier */
  hashedPhoneNumber: string
  /** Authentication method to use for verifying the signature in the Authorization header */
  authenticationMethod: string | undefined
  /** DEK signature over the user's phone number */
  signedUserPhoneNumber: string | undefined
  /** Client-specified session ID for the request. */
  sessionID: string | undefined
  /** Client-specified version string */
  version: string | undefined
}
export declare type MatchmakingRequest = GetContactMatchesRequest

export const MatchmakingRequestSchema: t.Type<MatchmakingRequest> = t.type({
  account: t.string,
  userPhoneNumber: t.string,
  contactPhoneNumbers: t.array(t.string),
  hashedPhoneNumber: t.string,
  authenticationMethod: t.union([t.string, t.undefined]),
  signedUserPhoneNumber: t.union([t.string, t.undefined]),
  sessionID: t.union([t.string, t.undefined]),
  version: t.union([t.string, t.undefined]),
})

export interface GetQuotaRequest {
  account: string
  /** Authentication method to use for verifying the signature in the Authorization header */
  authenticationMethod: string | undefined
  /** User's ODIS generated on-chain identifier */
  hashedPhoneNumber: string | undefined
  /** Client-specified session ID for the request. */
  sessionID: string | undefined
  /** Client-specified version string */
  version: string | undefined
}
export declare type PnpQuotaRequest = GetQuotaRequest

export const PnpQuotaRequestSchema: t.Type<PnpQuotaRequest> = t.type({
  account: t.string,
  authenticationMethod: t.union([t.string, t.undefined]),
  hashedPhoneNumber: t.union([t.string, t.undefined]),
  sessionID: t.union([t.string, t.undefined]),
  version: t.union([t.string, t.undefined]),
})

export type PhoneNumberPrivacyRequest = SignMessageRequest | MatchmakingRequest | PnpQuotaRequest

/**
 * Domain restricted signature request to get a pOPRF evaluation on the given message in a given
 * domain, as specified by CIP-40.
 *
 * @remarks Concrete request types are created by specifying the type parameter for Domain. If a
 * domain has no options, an empty struct should be used.
 */
export type DomainRestrictedSignatureRequest<D extends Domain = Domain> = {
  /** Domain specification. Selects the PRF domain and rate limiting rules. */
  domain: D
  /**
   * Domain-specific options.
   * Used for inputs relevant to the domain, but not part of the domain string.
   * Example: { "authorization": <signature> } for an account-restricted domain.
   */
  options: DomainOptions<D>
  /** Query message. A blinded elliptic curve point encoded in base64. */
  blindedMessage: string
  /** Client-specified session ID. */
  sessionID: EIP712Optional<string>
}

/**
 * Request to get the quota status of the given domain. ODIS will respond with the current state
 * relevant to calculating quota under the associated rate limiting rules.
 *
 * Options may be provided for authentication in case the quota state is non-public information.
 * E.g. Quota state may reveal whether or not a user has attempted to recover a given account.
 *
 * @remarks Concrete request types are created by specifying the type parameter for Domain. If a
 * domain has no options, an empty struct should be used.
 */
export type DomainQuotaStatusRequest<D extends Domain = Domain> = {
  /** Domain specification. Selects the PRF domain and rate limiting rules. */
  domain: D
  /** Domain-specific options. */
  options: DomainOptions<D>
  /** Client-specified session ID. */
  sessionID: EIP712Optional<string>
}

/**
 * Request to disable a domain such that not further requests for signatures in the given domain
 * will be served. Available for domains which need to option to prevent further requests for
 * security.
 *
 * Options may be provided for authentication to prevent unintended parties from disabling a domain.
 *
 * @remarks Concrete request types are created by specifying the type parameter for Domain. If a
 * domain has no options, an empty struct should be used.
 */
export type DisableDomainRequest<D extends Domain = Domain> = {
  /** Domain specification. Selects the PRF domain and rate limiting rules. */
  domain: D
  /** Domain-specific options. */
  options: DomainOptions<D>
  /** Client-specified session ID. */
  sessionID: EIP712Optional<string>
}

/** Union type of Domain API requests */
export type DomainRequest<D extends Domain = Domain> =
  | DomainRestrictedSignatureRequest<D>
  | DomainQuotaStatusRequest<D>
  | DisableDomainRequest<D>

export type OdisRequest<D extends Domain = Domain> = DomainRequest<D> | PhoneNumberPrivacyRequest

// NOTE: Next three functions are a bit repetitive. An attempt was made to combine them, but the
// type signature got quite complicated. Feel free to attempt it if you are motivated.

/** Parameterized schema for checking unknown input against DomainRestrictedSignatureRequest */
export function domainRestrictedSignatureRequestSchema<D extends Domain = Domain>(
  domain: t.Type<D>
): t.Type<DomainRestrictedSignatureRequest<D>> {
  // The schema defined here does most of the work, but does not guarantee consistency between the
  // domain and options fields. We wrap the schema below to add a consistency check.
  const schema = t.strict({
    domain,
    options: t.unknown,
    blindedMessage: t.string,
    sessionID: eip712OptionalSchema(t.string),
  })

  const validation = (
    unk: unknown,
    ctx: t.Context
  ): t.Validation<DomainRestrictedSignatureRequest<D>> =>
    pipe(
      schema.validate(unk, ctx),
      chain((value: t.TypeOf<typeof schema>) => {
        if (isSequentialDelayDomain(value.domain)) {
          const either = SequentialDelayDomainOptionsSchema.validate(value.options, ctx)
          if (isRight(either)) {
            return t.success(value as DomainRestrictedSignatureRequest<D>)
          }

          return t.failure(unk, ctx, 'options type does not match domain type')
        }

        // canary provides a compile-time check that all subtypes of Domain have branches. If a case
        // was missed, then an error will report that domain cannot be assigned to type `never`.
        const canary = (x: never) => x
        canary(value.domain)
        throw new Error('Implementation error: validated domain is not of any known type')
      })
    )

  return new t.Type<DomainRestrictedSignatureRequest<D>, DomainRestrictedSignatureRequest<D>>(
    `DomainRestrictedSignatureRequestSchema<${domain.name}>`,
    (unk: unknown): unk is DomainRestrictedSignatureRequest<D> => isRight(validation(unk, [])),
    validation,
    (req: DomainRestrictedSignatureRequest<D>) => req
  )
}

/** Parameterized schema for checking unknown input against DomainQuotaStatusRequest */
export function domainQuotaStatusRequestSchema<D extends Domain = Domain>(
  domain: t.Type<D>
): t.Type<DomainQuotaStatusRequest<D>> {
  // The schema defined here does most of the work, but does not guarantee consistency between the
  // domain and options fields. We wrap the schema below to add a consistency check.
  const schema = t.strict({
    domain,
    options: t.unknown,
    sessionID: eip712OptionalSchema(t.string),
  })

  const validation = (unk: unknown, ctx: t.Context): t.Validation<DomainQuotaStatusRequest<D>> =>
    pipe(
      schema.validate(unk, ctx),
      chain((value: t.TypeOf<typeof schema>) => {
        if (isSequentialDelayDomain(value.domain)) {
          const either = SequentialDelayDomainOptionsSchema.validate(value.options, ctx)
          if (isRight(either)) {
            return t.success(value as DomainQuotaStatusRequest<D>)
          }

          return t.failure(unk, ctx, 'options type does not match domain type')
        }

        // canary provides a compile-time check that all subtypes of Domain have branches. If a case
        // was missed, then an error will report that domain cannot be assigned to type `never`.
        const canary = (x: never) => x
        canary(value.domain)
        throw new Error('Implementation error: validated domain is not of any known type')
      })
    )

  return new t.Type<DomainQuotaStatusRequest<D>, DomainQuotaStatusRequest<D>>(
    `DomainQuotaStatusRequestSchema<${domain.name}>`,
    (unk: unknown): unk is DomainQuotaStatusRequest<D> => isRight(validation(unk, [])),
    validation,
    (req: DomainQuotaStatusRequest<D>) => req
  )
}

/** Parameterized schema for checking unknown input against DisableDomainRequest */
export function disableDomainRequestSchema<D extends Domain = Domain>(
  domain: t.Type<D>
): t.Type<DisableDomainRequest<D>> {
  // The schema defined here does most of the work, but does not guarantee consistency between the
  // domain and options fields. We wrap the schema below to add a consistency check.
  const schema = t.strict({
    domain,
    options: t.unknown,
    sessionID: eip712OptionalSchema(t.string),
  })

  const validation = (unk: unknown, ctx: t.Context): t.Validation<DisableDomainRequest<D>> =>
    pipe(
      schema.validate(unk, ctx),
      chain((value: t.TypeOf<typeof schema>) => {
        if (isSequentialDelayDomain(value.domain)) {
          const either = SequentialDelayDomainOptionsSchema.validate(value.options, ctx)
          if (isRight(either)) {
            return t.success(value as DisableDomainRequest<D>)
          }

          return t.failure(unk, ctx, 'options type does not match domain type')
        }

        // canary provides a compile-time check that all subtypes of Domain have branches. If a case
        // was missed, then an error will report that domain cannot be assigned to type `never`.
        const canary = (x: never) => x
        canary(value.domain)
        throw new Error('Implementation error: validated domain is not of any known type')
      })
    )

  return new t.Type<DisableDomainRequest<D>, DisableDomainRequest<D>>(
    `DisableDomainRequestSchema<${domain.name}>`,
    (unk: unknown): unk is DisableDomainRequest<D> => isRight(validation(unk, [])),
    validation,
    (req: DisableDomainRequest<D>) => req
  )
}

/** Wraps the signature request as an EIP-712 typed data structure for hashing and signing */
export function domainRestrictedSignatureRequestEIP712<D extends Domain>(
  request: DomainRestrictedSignatureRequest<D>
): EIP712TypedData {
  const domainTypes = domainEIP712Types(request.domain)
  const optionsTypes = domainOptionsEIP712Types(request.domain)
  return {
    types: {
      DomainRestrictedSignatureRequest: [
        { name: 'blindedMessage', type: 'string' },
        { name: 'domain', type: domainTypes.primaryType },
        // Only include the `options` field in the EIP-712 type if there are options.
        { name: 'options', type: optionsTypes.primaryType },
        { name: 'sessionID', type: 'Optional<string>' },
      ],
      ...domainTypes.types,
      ...optionsTypes.types,
      ...eip712OptionalType('string'),
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
      ],
    },
    primaryType: 'DomainRestrictedSignatureRequest',
    domain: {
      name: 'ODIS Domain Restricted Signature Request',
      version: '1',
    },
    message: request,
  }
}

/** Wraps the domain quota request as an EIP-712 typed data structure for hashing and signing */
export function domainQuotaStatusRequestEIP712<D extends Domain>(
  request: DomainQuotaStatusRequest<D>
): EIP712TypedData {
  const domainTypes = domainEIP712Types(request.domain)
  const optionsTypes = domainOptionsEIP712Types(request.domain)
  return {
    types: {
      DomainQuotaStatusRequest: [
        { name: 'domain', type: domainTypes.primaryType },
        // Only include the `options` field in the EIP-712 type if there are options.
        { name: 'options', type: optionsTypes.primaryType },
        { name: 'sessionID', type: 'Optional<string>' },
      ],
      ...domainTypes.types,
      ...optionsTypes.types,
      ...eip712OptionalType('string'),
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
      ],
    },
    primaryType: 'DomainQuotaStatusRequest',
    domain: {
      name: 'ODIS Domain Quota Status',
      version: '1',
    },
    message: request,
  }
}

/** Wraps the disable domain request as an EIP-712 typed data structure for hashing and signing */
export function disableDomainRequestEIP712<D extends Domain>(
  request: DisableDomainRequest<D>
): EIP712TypedData {
  const domainTypes = domainEIP712Types(request.domain)
  const optionsTypes = domainOptionsEIP712Types(request.domain)
  return {
    types: {
      DisableDomainRequest: [
        { name: 'domain', type: domainTypes.primaryType },
        // Only include the `options` field in the EIP-712 type if there are options.
        { name: 'options', type: optionsTypes.primaryType },
        { name: 'sessionID', type: 'Optional<string>' },
      ],
      ...domainTypes.types,
      ...optionsTypes.types,
      ...eip712OptionalType('string'),
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
      ],
    },
    primaryType: 'DisableDomainRequest',
    domain: {
      name: 'ODIS Disable Domain Request',
      version: '1',
    },
    message: request,
  }
}

/**
 * Generic function to verify the signature on a Domain API request.
 *
 * @remarks Passing in the builder allows the caller to handle the differences of EIP-712 types
 * between request types. Requests cannot be fully differentiated at runtime. In particular,
 * DomainQuotaStatusRequest and DisableDomainRequest are indistinguishable at runtime.
 *
 * @privateRemarks Function is currently defined explicitly in terms of SequentialDelayDomain. It
 * should be generalized to other authenticated domain types as they are standardized.
 */
function verifyRequestSignature<R extends DomainRequest<SequentialDelayDomain>>(
  typedDataBuilder: (request: R) => EIP712TypedData,
  request: R
): boolean {
  // If the address field is undefined, then this domain is unauthenticated.
  // Return false as the signature cannot be checked.
  if (!request.domain.address.defined) {
    return false
  }
  const signer = request.domain.address.value

  // If not signature is provided, return false.
  if (!request.options.signature.defined) {
    return false
  }
  const signature = request.options.signature.value

  // Requests are signed over the message excluding the signature. CIP-40 specifies that the
  // signature in the signed message should be the zero value. When the signature type is
  // EIP712Optional<string>, this is { defined: false, value: "" } (i.e. `noString`)
  const message: R = {
    ...request,
    options: {
      ...request.options,
      signature: noString,
    },
  }

  // Build the typed data then return the result of signature verification.
  const typedData = typedDataBuilder(message)
  return verifyEIP712TypedDataSigner(typedData, signature, signer)
}

/**
 * Verifies the authentication (e.g. client signature) over a domain signature request.
 * If the domain is unauthenticated, this function returns false.
 *
 * @remarks As specified in CIP-40, the signed message is the full request interpreted as EIP-712
 * typed data with the signature field in the domain options set to its zero value (i.e. It is set
 * to the undefined value for type EIP712Optional<string>).
 */
export function verifyDomainRestrictedSignatureRequestAuthenticity(
  request: DomainRestrictedSignatureRequest<SequentialDelayDomain>
): boolean {
  return verifyRequestSignature(domainRestrictedSignatureRequestEIP712, request)
}

/**
 * Verifies the authentication (e.g. client signature) over a domain status request.
 * If the domain is unauthenticated, this function returns false.
 *
 * @remarks As specified in CIP-40, the signed message is the full request interpreted as EIP-712
 * typed data with the signature field in the domain options set to its zero value (i.e. It is set
 * to the undefined value for type EIP712Optional<string>).
 */
export function verifyDomainQuotaStatusRequestAuthenticity(
  request: DomainQuotaStatusRequest<SequentialDelayDomain>
): boolean {
  return verifyRequestSignature(domainQuotaStatusRequestEIP712, request)
}

/**
 * Verifies the authentication (e.g. client signature) over a disable domain request.
 * If the domain is unauthenticated, this function returns false.
 *
 * @remarks As specified in CIP-40, the signed message is the full request interpreted as EIP-712
 * typed data with the signature field in the domain options set to its zero value (i.e. It is set
 * to the undefined value for type EIP712Optional<string>).
 */
export function verifyDisableDomainRequestAuthenticity(
  request: DisableDomainRequest<SequentialDelayDomain>
): boolean {
  return verifyRequestSignature(disableDomainRequestEIP712, request)
}
