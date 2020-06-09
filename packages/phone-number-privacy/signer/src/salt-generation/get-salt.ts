import { Request, Response } from 'express'
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

interface GetBlindedMessageForSaltRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
}

export async function handleGetBlindedMessageForSalt(
  request: Request<{}, {}, GetBlindedMessageForSaltRequest>,
  response: Response
) {
  logger.info('Begin getBlindedSalt request')
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

    const { account, blindedQueryPhoneNumber, hashedPhoneNumber } = request.body

    const remainingQueryCount = await getRemainingQueryCount(trx, account, hashedPhoneNumber)
    if (remainingQueryCount <= 0) {
      logger.debug('rolling back db transaction due to no remaining query count')
      trx.rollback()
      respondWithError(response, 403, ErrorMessages.EXCEEDED_QUOTA)
      return
    }
    const signature = await BLSCryptographyClient.computeBlindedSignature(blindedQueryPhoneNumber)
    await incrementQueryCount(account, trx)
    logger.debug('committing db transactions for salt retrieval data')
    await trx.commit()
    response.json({ success: true, signature })
  } catch (error) {
    logger.error('Failed to getSalt', error)
    if (trx) {
      logger.debug('rolling back db transaction')
      trx.rollback()
    }
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

function isValidGetSignatureInput(requestBody: GetBlindedMessageForSaltRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody)
  )
}
