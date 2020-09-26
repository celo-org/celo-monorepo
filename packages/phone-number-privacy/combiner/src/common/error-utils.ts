import { ErrorMessage, logger, WarningMessage } from '@celo/phone-number-privacy-common'
import { Response } from 'firebase-functions'
import { VERSION } from '../config'

export type ErrorType = ErrorMessage | WarningMessage

export function respondWithError(res: Response, statusCode: number, error: ErrorType) {
  logger.error('Responding with error', error)
  res.status(statusCode).json({ success: false, error, version: VERSION })
}
