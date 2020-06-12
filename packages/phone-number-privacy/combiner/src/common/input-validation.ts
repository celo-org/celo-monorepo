import { isValidAddress, trimLeading0x } from '@celo/utils/lib/address'
import { REASONABLE_BODY_CHAR_LIMIT } from './constants'

export function hasValidAccountParam(requestBody: any): boolean {
  return requestBody.account && isValidAddress(requestBody.account)
}

export function hasValidUserPhoneNumberParam(requestBody: any): boolean {
  return !!requestBody.userPhoneNumber
}

export function hasValidContractPhoneNumbersParam(requestBody: any): boolean {
  return requestBody.contactPhoneNumbers && Array.isArray(requestBody.contactPhoneNumbers)
}

export function isBodyReasonablySized(requestBody: any): boolean {
  return JSON.stringify(requestBody).length <= REASONABLE_BODY_CHAR_LIMIT
}

export function hasValidQueryPhoneNumberParam(requestBody: any): boolean {
  return !!requestBody.blindedQueryPhoneNumber
}

export function hasValidPhoneNumberHash(requestBody: any): boolean {
  return requestBody.hashedPhoneNumber && isByte32(requestBody.hashedPhoneNumber)
}

export function phoneNumberHashIsValidIfExists(requestBody: any): boolean {
  return !requestBody.hashedPhoneNumber || isByte32(requestBody.hashedPhoneNumber)
}

function isByte32(hashedData: string): boolean {
  return Buffer.byteLength(trimLeading0x(hashedData), 'hex') === 32
}
