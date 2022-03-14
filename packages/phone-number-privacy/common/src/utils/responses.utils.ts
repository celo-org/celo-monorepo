import Logger from 'bunyan'
import { Response } from 'express'
import { WarningMessage } from '..'

export function respondWithError(
  response: Response,
  body: { error: string },
  statusCode: number,
  logger: Logger
) {
  const logObj = { error: body.error, statusCode }
  if (body.error in WarningMessage) {
    logger.warn(logObj, 'Responding with warning')
  } else {
    logger.error(logObj, 'Responding with error')
  }
  response.status(statusCode).json(body)
}
