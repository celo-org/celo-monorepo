import { isValidAddress, trimLeading0x } from '@celo/utils/lib/address'
import isBase64 from 'is-base64'
import {
  GetBlindedMessageSigRequest,
  GetContactMatchesRequest,
  GetQuotaRequest,
} from '../interfaces'
import { REASONABLE_BODY_CHAR_LIMIT, REQUEST_EXPIRY_WINDOW_MS } from './constants'

export function hasValidAccountParam(requestBody: any): boolean {
  return requestBody.account && isValidAddress(requestBody.account)
}

function isValidPhoneNumberHash(phoneNumber: string) {
  return isBase64(phoneNumber) && Buffer.from(phoneNumber, 'base64').length === 32
}

export function hasValidUserPhoneNumberParam(requestBody: GetContactMatchesRequest): boolean {
  return !!requestBody.userPhoneNumber && isValidPhoneNumberHash(requestBody.userPhoneNumber)
}

export function hasValidContactPhoneNumbersParam(requestBody: GetContactMatchesRequest): boolean {
  return (
    Array.isArray(requestBody.contactPhoneNumbers) &&
    requestBody.contactPhoneNumbers.length > 0 &&
    requestBody.contactPhoneNumbers.every((contact) => isValidPhoneNumberHash(contact))
  )
}

export function isBodyReasonablySized(requestBody: any): boolean {
  return JSON.stringify(requestBody).length <= REASONABLE_BODY_CHAR_LIMIT
}

export function hasValidQueryPhoneNumberParam(requestBody: GetBlindedMessageSigRequest): boolean {
  return (
    !!requestBody.blindedQueryPhoneNumber &&
    requestBody.blindedQueryPhoneNumber.length === 64 &&
    isBase64(requestBody.blindedQueryPhoneNumber)
  )
}

export function hasValidTimestamp(requestBody: any): boolean {
  return (
    !requestBody.timestamp ||
    (typeof requestBody.timestamp === 'number' &&
      requestBody.timestamp > Date.now() - REQUEST_EXPIRY_WINDOW_MS)
  )
}

export function phoneNumberHashIsValidIfExists(requestBody: GetQuotaRequest): boolean {
  return !requestBody.hashedPhoneNumber || isByte32(requestBody.hashedPhoneNumber)
}

function isByte32(hashedData: string): boolean {
  return Buffer.byteLength(trimLeading0x(hashedData), 'hex') === 32
}
