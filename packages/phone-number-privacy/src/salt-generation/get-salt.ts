import { isValidAddress, trimLeading0x } from '@celo/utils/lib/address'
import { Request, Response } from 'firebase-functions'
import { BLSCryptographyClient } from '../bls/bls-cryptography-client'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser } from '../common/identity'
import logger from '../common/logger'
import { getTransaction } from '../database/database'
import { incrementQueryCount } from '../database/wrappers/account'
import { getRemainingQueryCount } from './query-quota'

export async function handleGetBlindedMessageForSalt(request: Request, response: Response) {
  const trx = await getTransaction()
  try {
    if (!isValidGetSignatureInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    authenticateUser()
    const remainingQueryCount = await getRemainingQueryCount(
      trx,
      request.body.account,
      request.body.hashedPhoneNumber
    )
    if (remainingQueryCount <= 0) {
      trx.rollback()
      respondWithError(response, 403, ErrorMessages.EXCEEDED_QUOTA)
      return
    }
    const signature = await BLSCryptographyClient.computeBlindedSignature(
      request.body.blindedQueryPhoneNumber
    )
    await incrementQueryCount(request.body.account, trx)
    response.json({ success: true, signature })
  } catch (error) {
    logger.error('Failed to getSalt', error)
    trx.rollback()
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

function isValidGetSignatureInput(requestBody: any): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody)
  )
}

function phoneNumberHashIsValidIfExists(requestBody: any): boolean {
  return !requestBody.hashedPhoneNumber || isByte32(requestBody.hashedPhoneNumber)
}

function hasValidAccountParam(requestBody: any): boolean {
  return requestBody.account && isValidAddress(requestBody.account)
}

function hasValidQueryPhoneNumberParam(requestBody: any): boolean {
  return requestBody.blindedQueryPhoneNumber
}

function isByte32(hashedData: string): boolean {
  return Buffer.byteLength(trimLeading0x(hashedData), 'hex') === 32
}
