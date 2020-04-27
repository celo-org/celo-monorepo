import * as Web3Utils from 'web3-utils'
import { privateKeyToAddress } from './address'
import { PhoneNumberUtils } from './phoneNumbers'
import { Signature, SignatureUtils } from './signatureUtils'

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

export function hashIdentifier(identifier: string, type: IdentifierType, salt?: string) {
  switch (type) {
    case IdentifierType.PHONE_NUMBER:
      return PhoneNumberUtils.getPhoneHash(identifier, salt)
    default:
      throw new Error('Unsupported Identifier Type')
  }
}

export function getAttestationMessageToSignFromIdentifier(identifier: string, account: string) {
  const messageHash: string = Web3Utils.soliditySha3(
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

export function base64ToHex(base64String: string) {
  return '0x' + Buffer.from(base64String, 'base64').toString('hex')
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
}
