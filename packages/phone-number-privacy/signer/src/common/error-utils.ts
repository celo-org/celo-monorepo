import {
  ErrorMessage,
  SignMessageResponseFailure,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Response } from 'express'
import { getVersion } from '../config'
import { Counters } from './metrics'

export type ErrorType = ErrorMessage | WarningMessage

export function respondWithError(
  endpoint: string,
  res: Response,
  statusCode: number,
  error: ErrorType,
  performedQueryCount: number = -1,
  totalQuota: number = -1,
  blockNumber: number = -1,
  signature?: string
) {
  const response: SignMessageResponseFailure = {
    success: false,
    version: getVersion(),
    error,
    performedQueryCount,
    totalQuota,
    blockNumber,
    signature,
  }

  const logger: Logger = res.locals.logger

  if (error in WarningMessage) {
    logger.warn({ error, statusCode, response }, 'Responding with warning')
  } else {
    logger.error({ error, statusCode, response }, 'Responding with error')
  }

  Counters.responses.labels(endpoint, statusCode.toString()).inc()
  res.status(statusCode).json(response)
}
