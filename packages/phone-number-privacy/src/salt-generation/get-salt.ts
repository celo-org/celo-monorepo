import { Request, Response } from 'firebase-functions'
import { BLSCryptographyClient } from '../bls/bls-cryptography-client'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser } from '../common/identity'
import {
  hasValidAccountParam,
  hasValidQueryPhoneNumberParam,
  isBodyReasonablySized,
  phoneNumberHashIsValidIfExists,
} from '../common/input-validation'
import logger from '../common/logger'
import { getTransaction } from '../database/database'
import { incrementQueryCount } from '../database/wrappers/account'
import { getRemainingQueryCount } from './query-quota'

export async function handleGetBlindedMessageForSalt(request: Request, response: Response) {
  let trx
  try {
    trx = await getTransaction()
    if (!isValidGetSignatureInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    if (!authenticateUser(request)) {
      respondWithError(response, 401, ErrorMessages.UNAUTHENTICATED_USER)
      return
    }
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
    if (trx) {
      trx.rollback()
    }
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

function isValidGetSignatureInput(requestBody: any): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody)
  )
}
