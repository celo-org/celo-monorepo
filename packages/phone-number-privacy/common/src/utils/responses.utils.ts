import Logger from 'bunyan'
import { Response } from 'express'
import { FailureResponse, OdisRequest, OdisResponse, WarningMessage } from '..'

export function respondWithError(
  response: Response,
  body: FailureResponse,
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

export function send<
  I extends OdisRequest = OdisRequest,
  O extends OdisResponse<I> = OdisResponse<I>
>(response: Response<O>, body: O, status: number, logger: Logger) {
  if (!body.success) {
    const logObj = { error: body.error, status, body }
    if (body.error in WarningMessage) {
      logger.warn(logObj, 'Responding with warning')
    } else {
      logger.error(logObj, 'Responding with error')
    }
  } else {
    logger.info({ status, body }, 'Responding with success')
  }
  response.status(status).json(body)
}
