import { isValidAddress, trimLeading0x } from '@celo/utils/lib/address'
import isBase64 from 'is-base64'
import {
  GetQuotaRequest,
  LegacySignMessageRequest,
  PnpQuotaRequest,
  SignMessageRequest,
} from '../interfaces'
import { REASONABLE_BODY_CHAR_LIMIT } from './constants'

export function hasValidAccountParam(requestBody: { account: string }): boolean {
  return !!requestBody.account && isValidAddress(requestBody.account)
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

const hexString = new RegExp(/[0-9A-Fa-f]{32}/, 'i')

function isByte32(hashedData: string): boolean {
  return hexString.test(trimLeading0x(hashedData))
}
