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
    logger.info('Responding with warning')
  } else {
    logger.info('Responding with error')
  }
  logger.error({ err, statusCode })
  res.status(statusCode).json({ success: false, err, version: VERSION })
}
