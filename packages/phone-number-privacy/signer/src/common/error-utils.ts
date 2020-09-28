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
  error: ErrorType,
  performedQueryCount: number = -1,
  totalQuota: number = -1,
  blockNumber: number = -1,
  signature?: string
) {
  const loggerMethod = error in WarningMessage ? logger.warn : logger.error
  loggerMethod({ err: error }, 'Responding with error')
  const response: SignMessageResponseFailure = {
    success: false,
    version: getVersion(),
    error,
    performedQueryCount,
    totalQuota,
    blockNumber,
    signature,
  }
  res.status(statusCode).json(response)
}
