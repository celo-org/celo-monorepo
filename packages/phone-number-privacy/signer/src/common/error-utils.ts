import {
  ErrorMessage,
  logger,
  SignMessageResponseFailure,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Response } from 'express'
import { getVersion } from '../config'
export type ErrorType = ErrorMessage | WarningMessage

export function respondWithError(
  res: Response,
  statusCode: number,
  err: ErrorType,
  performedQueryCount: number = -1,
  totalQuota: number = -1,
  blockNumber: number = -1,
  signature?: string
) {
  logger.info('Responding with error')
  if (err in WarningMessage) {
    logger.warn({ err })
  } else {
    logger.error({ err })
  }
  const response: SignMessageResponseFailure = {
    success: false,
    version: getVersion(),
    error: err,
    performedQueryCount,
    totalQuota,
    blockNumber,
    signature,
  }
  res.status(statusCode).json(response)
}
