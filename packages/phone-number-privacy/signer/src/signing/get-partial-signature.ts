import {
  authenticateUser,
  ErrorMessage,
  hasValidAccountParam,
  hasValidQueryPhoneNumberParam,
  hasValidTimestamp,
  isBodyReasonablySized,
  logger,
  phoneNumberHashIsValidIfExists,
  SignMessageResponse,
  SignMessageResponseFailure,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { respondWithError } from '../common/error-utils'
import { getVersion } from '../config'
import { incrementQueryCount } from '../database/wrappers/account'
import { getRequestExists, storeRequest } from '../database/wrappers/request'
import { getKeyProvider } from '../key-management/key-provider'
import { getBlockNumber, getContractKit } from '../web3/contracts'
import { getRemainingQueryCount } from './query-quota'

export interface GetBlindedMessagePartialSigRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
  timestamp?: number
}

export async function handleGetBlindedMessagePartialSig(
  request: Request<{}, {}, GetBlindedMessagePartialSigRequest>,
  response: Response
) {
  logger.info('Begin handleGetBlindedMessagePartialSig request')
  try {
    if (!isValidGetSignatureInput(request.body)) {
      respondWithError(response, 400, WarningMessage.INVALID_INPUT)
      return
    }
    if (!(await authenticateUser(request, getContractKit()))) {
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER)
      return
    }

    const { account, blindedQueryPhoneNumber, hashedPhoneNumber } = request.body

    // Set default values in the case of an error
    let performedQueryCount = -1
    let totalQuota = -1
    let blockNumber = -1
    let errorMsg
    // In the case of a DB or blockchain connection failure, don't block user
    // but set the error status accordingly
    try {
      const queryCount = await getRemainingQueryCount(account, hashedPhoneNumber)
      performedQueryCount = queryCount.performedQueryCount
      totalQuota = queryCount.totalQuota
    } catch (err) {
      logger.error('Failed to get user quota')
      logger.error({ err })
      errorMsg = ErrorMessage.DATABASE_GET_FAILURE
    }
    try {
      blockNumber = await getBlockNumber()
    } catch (err) {
      logger.error('Failed to get latest block number')
      logger.error({ err })
      errorMsg = ErrorMessage.CONTRACT_GET_FAILURE
    }

    if (errorMsg !== ErrorMessage.DATABASE_GET_FAILURE && performedQueryCount >= totalQuota) {
      logger.debug('No remaining query count')
      respondWithError(
        response,
        403,
        WarningMessage.EXCEEDED_QUOTA,
        performedQueryCount,
        totalQuota,
        blockNumber
      )
      return
    }

    const keyProvider = getKeyProvider()
    const privateKey = keyProvider.getPrivateKey()
    const signature = computeBlindedSignature(blindedQueryPhoneNumber, privateKey)

    if (await getRequestExists(request.body)) {
      logger.debug(
        'Signature request already exists in db. Will not store request or increment query count.'
      )
      errorMsg = WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG
    } else {
      if (!(await storeRequest(request.body))) {
        logger.debug('Did not store request.')
        errorMsg = ErrorMessage.FAILURE_TO_STORE_REQUEST
      }
      if (!(await incrementQueryCount(account))) {
        logger.debug('Did not increment query count.')
        errorMsg = ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT
      } else {
        performedQueryCount++
      }
    }

    let signMessageResponse: SignMessageResponse
    const signMessageResponseSuccess: SignMessageResponse = {
      success: !errorMsg,
      signature,
      version: getVersion(),
      performedQueryCount,
      totalQuota,
      blockNumber,
    }
    if (errorMsg) {
      const signMessageResponseFailure = signMessageResponseSuccess as SignMessageResponseFailure
      signMessageResponseFailure.error = errorMsg
      signMessageResponse = signMessageResponseFailure
    } else {
      signMessageResponse = signMessageResponseSuccess
    }
    logger.debug('Signature retrieval success')
    response.json(signMessageResponse)
  } catch (err) {
    logger.error('Failed to get signature')
    logger.error({ err })
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR)
  }
}

function isValidGetSignatureInput(requestBody: GetBlindedMessagePartialSigRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody) &&
    hasValidTimestamp(requestBody)
  )
}
