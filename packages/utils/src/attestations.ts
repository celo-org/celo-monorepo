import * as Web3Utils from 'web3-utils'
import { privateKeyToAddress } from './address'
import { Signature, SignatureUtils } from './signatureUtils'

enum IdentifierType {
  PHONE_NUMBER,
}

function hashIdentifier(identifier: string, type: IdentifierType) {
  switch (type) {
    case IdentifierType.PHONE_NUMBER:
      return Web3Utils.soliditySha3({ type: 'string', value: identifier })
    default:
      return ''
  }
}

export function getAttestationMessageToSignFromIdentifier(identifier: string, account: string) {
  return getAttestationMessageToSignFromPhoneHash(
    hashIdentifier(identifier, IdentifierType.PHONE_NUMBER),
    account
  )
}

export function getAttestationMessageToSignFromPhoneHash(phoneHash: string, account: string) {
  const messageHash: string = Web3Utils.soliditySha3(
    { type: 'bytes32', value: phoneHash },
    { type: 'address', value: account }
  )
  return messageHash
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
  getAttestationMessageToSignFromIdentifier,
  getAttestationMessageToSignFromPhoneHash,
  base64ToHex,
  attestToIdentifier,
  sanitizeMessageBase64,
  messageContainsAttestationCode,
  extractAttestationCodeFromMessage,
}
