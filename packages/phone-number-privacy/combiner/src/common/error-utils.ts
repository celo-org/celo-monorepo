import { ErrorMessage, WarningMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Response } from 'firebase-functions'
import { VERSION } from '../config'

export type ErrorType = ErrorMessage | WarningMessage

export function respondWithError(
  res: Response,
  statusCode: number,
  err: ErrorType,
  logger: Logger
) {
  if (err in WarningMessage) {
    logger.warn({ err, statusCode }, 'Responding with warning')
  } else {
    logger.error({ err, statusCode }, 'Responding with error')
  }
  res.status(statusCode).json({ success: false, err, version: VERSION })
}
