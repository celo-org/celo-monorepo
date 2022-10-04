import { isValidAddress, trimLeading0x } from '@celo/utils/lib/address'
import isBase64 from 'is-base64'
import {
  GetContactMatchesRequest,
  GetQuotaRequest,
  LegacySignMessageRequest,
  PnpQuotaRequest,
  SignMessageRequest,
} from '../interfaces'
import { REASONABLE_BODY_CHAR_LIMIT } from './constants'

export function hasValidAccountParam(requestBody: { account: string }): boolean {
  return !!requestBody.account && isValidAddress(requestBody.account)
}

export function hasValidUserPhoneNumberParam(requestBody: GetContactMatchesRequest): boolean {
  return !!requestBody.userPhoneNumber && isValidObfuscatedPhoneNumber(requestBody.userPhoneNumber)
}

export function hasValidContactPhoneNumbersParam(requestBody: GetContactMatchesRequest): boolean {
  return (
    Array.isArray(requestBody.contactPhoneNumbers) &&
    requestBody.contactPhoneNumbers.length > 0 &&
    requestBody.contactPhoneNumbers.every((contact) => isValidObfuscatedPhoneNumber(contact))
  )
}

// Legacy message signing & quota requests extend the new types
export function isBodyReasonablySized(requestBody: SignMessageRequest | PnpQuotaRequest): boolean {
  return JSON.stringify(requestBody).length <= REASONABLE_BODY_CHAR_LIMIT
}

export function hasValidBlindedPhoneNumberParam(requestBody: SignMessageRequest): boolean {
  return (
    !!requestBody.blindedQueryPhoneNumber &&
    requestBody.blindedQueryPhoneNumber.length === 64 &&
    isBase64(requestBody.blindedQueryPhoneNumber)
  )
}

export function identifierIsValidIfExists(
  requestBody: GetQuotaRequest | LegacySignMessageRequest
): boolean {
  return !requestBody.hashedPhoneNumber || isByte32(requestBody.hashedPhoneNumber)
}

export function hasValidIdentifier(requestBody: GetContactMatchesRequest): boolean {
  return !!requestBody.hashedPhoneNumber && isByte32(requestBody.hashedPhoneNumber)
}

function isValidObfuscatedPhoneNumber(phoneNumber: string) {
  return isBase64(phoneNumber) && Buffer.from(phoneNumber, 'base64').length === 32
}

const hexString = new RegExp(/[0-9A-Fa-f]{32}/, 'i')

function isByte32(hashedData: string): boolean {
  return hexString.test(trimLeading0x(hashedData))
}
