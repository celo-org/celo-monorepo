import Logger from 'bunyan'
import { Response } from 'express'
import { FailureResponse, OdisRequest, OdisResponse, WarningMessage } from '..'

// TODO: remove this once it is no longer being used by matchmaking
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
    if (body.error in WarningMessage) {
      logger.warn({ error: body.error, status, body }, 'Responding with warning')
    } else {
      logger.error({ error: body.error, status, body }, 'Responding with error')
    }
  } else {
    logger.info({ status, body }, 'Responding with success')
  }
  response.status(status).json(body)
}
