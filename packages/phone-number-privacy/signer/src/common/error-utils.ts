import {
  ErrorMessage,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Response } from 'express'
import { VERSION } from '../config'
import logger from './logger'

export type ErrorType = ErrorMessage | WarningMessage

export function respondWithError(
  res: Response,
  statusCode: number,
  error: ErrorType,
  performedQueryCount?: number,
  totalQuota?: number
) {
  const loggerMethod = error in WarningMessage ? logger.warn : logger.error
  loggerMethod('Responding with error', error)
  const response: SignMessageResponse = {
    success: false,
    version: VERSION,
    error,
    performedQueryCount,
    totalQuota,
  }
  res.status(statusCode).json(response)
}
