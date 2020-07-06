import {
  ErrorMessage,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { respondWithError } from '../common/error-utils'
import { authenticateUser } from '../common/identity'
import {
  hasValidAccountParam,
  hasValidQueryPhoneNumberParam,
  isBodyReasonablySized,
  phoneNumberHashIsValidIfExists,
} from '../common/input-validation'
import logger from '../common/logger'
import { VERSION } from '../config'
import { incrementQueryCount } from '../database/wrappers/account'
import { getKeyProvider } from '../key-management/key-provider'
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
  try {
    if (!isValidGetSignatureInput(request.body)) {
      respondWithError(response, 400, WarningMessage.INVALID_INPUT)
      return
    }
    if (!authenticateUser(request)) {
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER)
      return
    }

    const { account, blindedQueryPhoneNumber, hashedPhoneNumber } = request.body
    const [performedQueryCount, totalQuota] = await getRemainingQueryCount(
      account,
      hashedPhoneNumber
    )
    if (performedQueryCount >= totalQuota) {
      logger.debug('No remaining query count')
      respondWithError(
        response,
        403,
        WarningMessage.EXCEEDED_QUOTA,
        performedQueryCount,
        totalQuota
      )
      return
    }
    const keyProvider = getKeyProvider()
    const privateKey = keyProvider.getPrivateKey()
    const signature = computeBlindedSignature(blindedQueryPhoneNumber, privateKey)
    await incrementQueryCount(account)
    logger.debug('Salt retrieval success')

    const signMessageResponse: SignMessageResponse = {
      success: true,
      signature,
      version: VERSION,
      performedQueryCount,
      totalQuota,
    }
    response.json(signMessageResponse)
  } catch (error) {
    logger.error('Failed to getSalt', error)
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR)
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
