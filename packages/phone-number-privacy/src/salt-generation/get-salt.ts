import { isValidAddress } from '@celo/utils/lib/address'
import { Request, Response } from 'firebase-functions'
import { BLSCryptographyClient } from '../bls/bls-cryptography-client'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser } from '../common/identity'
import logger from '../common/logger'
import { incrementQueryCount } from '../database/wrappers/account'
import { getRemainingQueryCount } from './query-quota'

export async function handleGetBlindedMessageForSalt(request: Request, response: Response) {
  try {
    if (!isValidGetSignatureInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    authenticateUser()
    const remainingQueryCount = await getRemainingQueryCount(
      request.body.account,
      request.body.hashedPhoneNumber
    )
    if (remainingQueryCount <= 0) {
      respondWithError(response, 403, ErrorMessages.EXCEEDED_QUOTA)
      return
    }
    const signature = await BLSCryptographyClient.computeBlindedSignature(
      request.body.blindedQueryPhoneNumber
    )
    await incrementQueryCount(request.body.account)
    response.json({ success: true, signature })
  } catch (error) {
    logger.error('Failed to getSalt', error)
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

function isValidGetSignatureInput(requestBody: any): boolean {
  return hasValidAccountParam(requestBody) && hasValidQueryPhoneNumberParam(requestBody)
}

function hasValidAccountParam(requestBody: any): boolean {
  return requestBody.account && isValidAddress(requestBody.account)
}

function hasValidQueryPhoneNumberParam(requestBody: any): boolean {
  return requestBody.blindedQueryPhoneNumber
}
