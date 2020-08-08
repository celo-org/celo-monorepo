import {
  base64ToHex,
  extractAttestationCodeFromMessage,
  getIdentifierPrefix,
  hashIdentifier as baseHashIdentifier,
  IdentifierType,
  isAccountConsideredVerified,
  messageContainsAttestationCode,
  sanitizeMessageBase64,
} from '@celo/base/lib/attestations'
import { soliditySha3 } from 'web3-utils'
import { privateKeyToAddress } from './address'
import { Signature, SignatureUtils } from './signatureUtils'

// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export {
  AttestationsStatus,
  base64ToHex,
  extractAttestationCodeFromMessage,
  getIdentifierPrefix,
  IdentifierType,
  isAccountConsideredVerified,
  messageContainsAttestationCode,
  sanitizeMessageBase64,
} from '@celo/base/lib/attestations'

const sha3 = (v: string): string | null => soliditySha3({ type: 'string', value: v })
export function hashIdentifier(identifier: string, type: IdentifierType, salt?: string) {
  return baseHashIdentifier(sha3, identifier, type, salt)
}

export function getAttestationMessageToSignFromIdentifier(identifier: string, account: string) {
  const messageHash: string = soliditySha3(
    { type: 'bytes32', value: identifier },
    { type: 'address', value: account }
  )
  return messageHash
}

export function getAttestationMessageToSignFromPhoneNumber(
  phoneNumber: string,
  account: string,
  phoneSalt?: string
) {
  return getAttestationMessageToSignFromIdentifier(
    hashIdentifier(phoneNumber, IdentifierType.PHONE_NUMBER, phoneSalt),
    account
  )
}

export function attestToIdentifier(
  identifier: string,
  account: string,
  privateKey: string
): Signature {
  const issuer = privateKeyToAddress(privateKey)
  const { v, r, s } = SignatureUtils.signMessage(
    getAttestationMessageToSignFromIdentifier(identifier, account),
    privateKey,
    issuer
  )
  return { v, r, s }
}

export const AttestationUtils = {
  IdentifierType,
  getIdentifierPrefix,
  hashIdentifier,
  getAttestationMessageToSignFromIdentifier,
  getAttestationMessageToSignFromPhoneNumber,
  base64ToHex,
  attestToIdentifier,
  sanitizeMessageBase64,
  messageContainsAttestationCode,
  extractAttestationCodeFromMessage,
  isAccountConsideredVerified,
}
