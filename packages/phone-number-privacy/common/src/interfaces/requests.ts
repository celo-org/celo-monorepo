import {
  EIP712Optional,
  eip712OptionalType,
  EIP712TypedData,
  noString,
} from '@celo/utils/lib/sign-typed-data-utils'
import { verifyEIP712TypedDataSigner } from '@celo/utils/lib/signatureUtils'
import {
  Domain,
  domainEIP712Types,
  DomainOptions,
  domainOptionsEIP712Types,
  SequentialDelayDomain,
} from '../domains'

export enum PhoneNumberPrivacyEndpoint {
  STATUS = '/status',
  METRICS = '/metrics',
  GET_BLINDED_MESSAGE_PARTIAL_SIG = '/getBlindedMessagePartialSig',
  GET_QUOTA = '/getQuota',
}

export enum DomainEndpoint {
  DISABLE_DOMAIN = '/domain/disable',
  DOMAIN_SIGN = '/domain/sign/',
  DOMAIN_QUOTA_STATUS = '/domain/quotaStatus',
}

export type SignerEndpoint = PhoneNumberPrivacyEndpoint | DomainEndpoint
export const SignerEndpoint = { ...PhoneNumberPrivacyEndpoint, ...DomainEndpoint }

export enum CombinerEndpoint {
  SIGN_MESSAGE = '/getBlindedMessageSig',
  MATCHMAKING = '/getContactMatches',
}

export type Endpoint = SignerEndpoint | CombinerEndpoint
export const Endpoint = { ...SignerEndpoint, ...CombinerEndpoint }

export enum AuthenticationMethod {
  WALLET_KEY = 'wallet_key',
  ENCRYPTION_KEY = 'encryption_key',
}

export interface GetBlindedMessageSigRequest {
  /** Celo account address. Query is charged against this account's quota. */
  account: string
  /** Authentication method to use for verifying the signature in the Authorization header */
  authenticationMethod?: AuthenticationMethod
  /** Query message. A blinded elliptic curve point encoded in base64. */
  blindedQueryPhoneNumber: string
  /** Optional on-chain identifier. Unlocks additional quota if the account is verified as an owner of the identifier. */
  hashedPhoneNumber?: string
  /** Client-specified session ID for the request. */
  sessionID?: string
  /** Client-specified version string */
  version?: string
}

export interface GetContactMatchesRequest {
  account: string
  /** Authentication method to use for verifying the signature in the Authorization header */
  authenticationMethod?: AuthenticationMethod
  userPhoneNumber: string // obfuscated with deterministic salt
  contactPhoneNumbers: string[] // obfuscated with deterministic salt
  hashedPhoneNumber: string // on-chain identifier
  signedUserPhoneNumber?: string // signed with DEK
  sessionID?: string
  /** Client-specified version string */
  version?: string
}

export interface GetQuotaRequest {
  account: string
  /** Authentication method to use for verifying the signature in the Authorization header */
  authenticationMethod?: AuthenticationMethod
  hashedPhoneNumber?: string // on-chain identifier
  sessionID?: string
  /** Client-specified version string */
  version?: string
}

export type PhoneNumberPrivacyRequest =
  | GetBlindedMessageSigRequest
  | GetContactMatchesRequest
  | GetQuotaRequest

/**
 * Domain restricted signature request to get a pOPRF evaluation on the given message in a given
 * domain, as specified by CIP-40.
 *
 * @remarks Concrete request types are created by specifying the type parameters for Domain and
 * DomainOptions. If the specified Domain has associated options, then the options field is
 * required. If not, it must not be provided.
 */
export type DomainRestrictedSignatureRequest<D extends Domain = Domain> = OmitIfNever<
  {
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
  },
  'options'
>

/**
 * Request to get the quota status of the given domain. ODIS will respond with the current state
 * relevant to calculating quota under the associated rate limiting rules.
 *
 * Options may be provided for authentication in case the quota state is non-public information.
 * E.g. Quota state may reveal whether or not a user has attempted to recover a given account.
 *
 * @remarks Concrete request types are created by specifying the type parameters for Domain and
 * DomainOptions. If the specified Domain has associated options, then the options field is
 * required. If not, it must not be provided.
 */
export type DomainQuotaStatusRequest<D extends Domain = Domain> = OmitIfNever<
  {
    /** Domain specification. Selects the PRF domain and rate limiting rules. */
    domain: D
    /** Domain-specific options. */
    options: DomainOptions<D>
    /** Client-specified session ID. */
    sessionID: EIP712Optional<string>
  },
  'options'
>

/**
 * Request to disable a domain such that not further requests for signatures in the given domain
 * will be served. Available for domains which need to option to prevent further requests for
 * security.
 *
 * Options may be provided for authentication to prevent unintended parties from disabling a domain.
 *
 * @remarks Concrete request types are created by specifying the type parameters for Domain and
 * DomainOptions. If the specified Domain has associated options, then the options field is
 * required. If not, it must not be provided.
 */
export type DisableDomainRequest<D extends Domain = Domain> = OmitIfNever<
  {
    /** Domain specification. Selects the PRF domain and rate limiting rules. */
    domain: D
    /** Domain-specific options. */
    options: DomainOptions<D>
    /** Client-specified session ID. */
    sessionID: EIP712Optional<string>
  },
  'options'
>

/** Union type of Domain API requests */
export type DomainRequest<D extends Domain = Domain> =
  | DomainRestrictedSignatureRequest<D>
  | DomainQuotaStatusRequest<D>
  | DisableDomainRequest<D>

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
        ...(optionsTypes ? [{ name: 'options', type: optionsTypes.primaryType }] : []),
        { name: 'sessionID', type: 'Optional<string>' },
      ],
      ...domainTypes.types,
      ...optionsTypes?.types,
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
        ...(optionsTypes ? [{ name: 'options', type: optionsTypes.primaryType }] : []),
        { name: 'sessionID', type: 'Optional<string>' },
      ],
      ...domainTypes.types,
      ...optionsTypes?.types,
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
        ...(optionsTypes ? [{ name: 'options', type: optionsTypes.primaryType }] : []),
        { name: 'sessionID', type: 'Optional<string>' },
      ],
      ...domainTypes.types,
      ...optionsTypes?.types,
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
 * Verifies the signature over a signature request for authenticated domains.
 * If the domain is unauthenticated, this function returns false.
 *
 * @remarks As specified in CIP-40, the signed message is the full request interpretted as EIP-712
 * typed data with the signature field in the domain options set to its zero value (i.e. It is set
 * to the undefined value for type EIP712Optional<string>).
 */
export function verifyDomainRestrictedSignatureRequestSignature(
  request: DomainRestrictedSignatureRequest<SequentialDelayDomain>
): boolean {
  return verifyRequestSignature(domainRestrictedSignatureRequestEIP712, request)
}

/**
 * Verifies the signature over a domain quota status request for authenticated domains.
 * If the domain is unauthenticated, this function returns false.
 *
 * @remarks As specified in CIP-40, the signed message is the full request interpretted as EIP-712
 * typed data with the signature field in the domain options set to its zero value (i.e. It is set
 * to the undefined value for type EIP712Optional<string>).
 */
export function verifyDomainQuotaStatusRequestSignature(
  request: DomainQuotaStatusRequest<SequentialDelayDomain>
): boolean {
  return verifyRequestSignature(domainQuotaStatusRequestEIP712, request)
}

/**
 * Verifies the signature over a disable domain request for authenticated domains.
 * If the domain is unauthenticated, this function returns false.
 *
 * @remarks As specified in CIP-40, the signed message is the full request interpretted as EIP-712
 * typed data with the signature field in the domain options set to its zero value (i.e. It is set
 * to the undefined value for type EIP712Optional<string>).
 */
export function verifyDisableDomainRequestSignature(
  request: DisableDomainRequest<SequentialDelayDomain>
): boolean {
  return verifyRequestSignature(disableDomainRequestEIP712, request)
}

// Use distributive conditional types to extract from the keys of T, keys with value type != never.
// Eg. AssignableKeys<{ foo: string, bar: never }, 'foo'|'bar'> = 'foo'
type AssignableKeys<T, K extends keyof T> = K extends (T[K] extends never ? never : K) ? K : never

// Exclude fields with value type `never` from T. If K is specified, only check those keys.
// Used above to exclude the 'option' field if its type is specified as `never` (i.e. no options).
// Eg. OmitIfNever<{ foo: string, bar: never, baz: never }, 'foo'|'bar'> = { foo: string, baz: never }
type OmitIfNever<T, K extends keyof T = keyof T> = Omit<T, K> & Pick<T, AssignableKeys<T, K>>
