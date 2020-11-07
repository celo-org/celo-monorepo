import { getPhoneHash } from './phoneNumbers'

const DEFAULT_NUM_ATTESTATIONS_REQUIRED = 3
const DEFAULT_ATTESTATION_THRESHOLD = 0.25

// Supported identifer types for attestations
export enum IdentifierType {
  PHONE_NUMBER = 0,
  // In the future, other types like usernames or emails could go here
}

// Each identifer type has a unique prefix to prevent unlikely but possible collisions
export function getIdentifierPrefix(type: IdentifierType) {
  switch (type) {
    case IdentifierType.PHONE_NUMBER:
      return 'tel://'
    default:
      throw new Error('Unsupported Identifier Type')
  }
}

export function hashIdentifier(
  sha3: (a: string) => string | null,
  identifier: string,
  type: IdentifierType,
  salt?: string
) {
  switch (type) {
    case IdentifierType.PHONE_NUMBER:
      return getPhoneHash(sha3, identifier, salt)
    default:
      throw new Error('Unsupported Identifier Type')
  }
}

export function base64ToHex(base64String: string) {
  return '0x' + Buffer.from(base64String, 'base64').toString('hex')
}

export function sanitizeMessageBase64(base64String: string) {
  // Replace occurrences of ¿ with _. Unsure why that is happening right now
  return base64String.replace(/(¿|§)/gi, '_')
}

const attestationCodeRegex = new RegExp(
  /(.* |^)(?:celo:\/\/wallet\/v\/)?([a-zA-Z0-9=\+\/_-]{87,88})($| .*)/
)

export function messageContainsAttestationCode(message: string) {
  return attestationCodeRegex.test(message)
}

export function extractAttestationCodeFromMessage(message: string) {
  const sanitizedMessage = sanitizeMessageBase64(message)

  if (!messageContainsAttestationCode(sanitizedMessage)) {
    return null
  }

  const matches = sanitizedMessage.match(attestationCodeRegex)
  if (!matches || matches.length < 3) {
    return null
  }
  return base64ToHex(matches[2])
}

export interface AttestationsStatus {
  isVerified: boolean
  numAttestationsRemaining: number
  total: number
  completed: number
}

interface AttestationStat {
  completed: number
  total: number
}

/**
 * Returns true if an AttestationStat is considered verified using the given factors,
 * or defaults if factors are ommited.
 * @param stats AttestationStat of the account's attestation identitifer, retrievable via lookupIdentitfiers
 * @param numAttestationsRequired Optional number of attestations required.  Will default to
 *  hardcoded value if absent.
 * @param attestationThreshold Optional threshold for fraction attestations completed. Will
 *  default to hardcoded value if absent.
 */
export function isAccountConsideredVerified(
  stats: AttestationStat | undefined,
  numAttestationsRequired: number = DEFAULT_NUM_ATTESTATIONS_REQUIRED,
  attestationThreshold: number = DEFAULT_ATTESTATION_THRESHOLD
): AttestationsStatus {
  if (!stats) {
    return {
      isVerified: false,
      numAttestationsRemaining: 0,
      total: 0,
      completed: 0,
    }
  }
  const numAttestationsRemaining = numAttestationsRequired - stats.completed
  const fractionAttestation = stats.total < 1 ? 0 : stats.completed / stats.total
  // 'verified' is a term of convenience to mean that the attestation stats for a
  // given identifier are beyond a certain threshold of confidence
  const isVerified = numAttestationsRemaining <= 0 && fractionAttestation >= attestationThreshold

  return {
    isVerified,
    numAttestationsRemaining,
    total: stats.total,
    completed: stats.completed,
  }
}

export const AttestationBase = {
  IdentifierType,
  getIdentifierPrefix,
  hashIdentifier,
  base64ToHex,
  sanitizeMessageBase64,
  messageContainsAttestationCode,
  extractAttestationCodeFromMessage,
  isAccountConsideredVerified,
}
