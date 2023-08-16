import Logger from 'bunyan'
import { Response } from 'express'
import { OdisRequest, OdisResponse, WarningMessage } from '..'

export function send<
  I extends OdisRequest = OdisRequest,
  O extends OdisResponse<I> = OdisResponse<I>
>(response: Response<O>, body: O, status: number, logger: Logger) {
  if (!response.headersSent) {
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
    logger.info('Completed send')
  }
}
