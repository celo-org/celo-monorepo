import { isValidAddress } from '@celo/utils/lib/address'
import isBase64 from 'is-base64'
import { PnpQuotaRequest, SignMessageRequest } from '../interfaces'
import { REASONABLE_BODY_CHAR_LIMIT } from './constants'

export function hasValidAccountParam(requestBody: { account: string }): boolean {
  return !!requestBody.account && isValidAddress(requestBody.account)
}

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
