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
  err: ErrorType,
  performedQueryCount: number = -1,
  totalQuota: number = -1,
  blockNumber: number = -1,
  signature?: string
) {
  const logger: Logger = res.locals.logger
  if (err in WarningMessage) {
    logger.info('Responding with warning')
    logger.warn({ err, statusCode })
  } else {
    logger.info('Responding with error')
    logger.error({ err, statusCode })
  }
  Counters.responses.labels(endpoint, statusCode.toString()).inc()

  const response: SignMessageResponseFailure = {
    success: false,
    version: getVersion(),
    error: err,
    performedQueryCount,
    totalQuota,
    blockNumber,
    signature,
  }
  logger.debug({ response })
  res.status(statusCode).json(response)
}
