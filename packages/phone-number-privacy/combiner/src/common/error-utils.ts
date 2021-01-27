import { ErrorMessage, WarningMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Response } from 'firebase-functions'
import { VERSION } from '../config'

export type ErrorType = ErrorMessage | WarningMessage

export function respondWithError(
  res: Response,
  statusCode: number,
  error: ErrorType,
  logger: Logger
) {
  if (error in WarningMessage) {
    logger.warn({ error, statusCode }, 'Responding with warning')
  } else {
    logger.error({ error, statusCode }, 'Responding with error')
  }
  res.status(statusCode).json({ success: false, error, version: VERSION })
}
