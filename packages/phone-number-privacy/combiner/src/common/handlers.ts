import {
  ErrorMessage,
  OdisRequest,
  OdisResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { performance, PerformanceObserver } from 'perf_hooks'
import { sendFailure } from './io'

export interface Locals {
  logger: Logger
}

export type PromiseHandler<R extends OdisRequest> = (
  request: Request<{}, {}, R>,
  res: Response<OdisResponse<R>, Locals>
) => Promise<void>

type ParentHandler = (req: Request<{}, {}, any>, res: Response<any, Locals>) => Promise<void>

export function catchErrorHandler<R extends OdisRequest>(
  handler: PromiseHandler<R>
): ParentHandler {
  return async (req, res) => {
    const logger: Logger = res.locals.logger
    try {
      await handler(req, res)
    } catch (err) {
      logger.error(ErrorMessage.CAUGHT_ERROR_IN_ENDPOINT_HANDLER)
      logger.error(err)
      if (!res.headersSent) {
        logger.info('Responding with error in outer endpoint handler')
        res.status(500).json({
          success: false,
          error: ErrorMessage.UNKNOWN_ERROR,
        })
      } else {
        logger.error(ErrorMessage.ERROR_AFTER_RESPONSE_SENT)
      }
    }
  }
}

export function meteringHandler<R extends OdisRequest>(
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  return async (req, res) => {
    const logger: Logger = res.locals.logger

    // used for log based metrics
    logger.info({ req: req.body }, 'Request received')

    const eventLoopLagMeasurementStart = Date.now()
    setTimeout(() => {
      const eventLoopLag = Date.now() - eventLoopLagMeasurementStart
      logger.info({ eventLoopLag }, 'Measure event loop lag')
    })
    const startMark = `Begin ${req.url}`
    const endMark = `End ${req.url}`
    const entryName = `${req.url} latency`

    const obs = new PerformanceObserver((list) => {
      const entry = list.getEntriesByName(entryName)[0]
      if (entry) {
        logger.info({ latency: entry }, 'e2e response latency measured')
      }
    })
    obs.observe({ entryTypes: ['measure'], buffered: false })

    performance.mark(startMark)

    try {
      await handler(req, res)
      if (res.headersSent) {
        // used for log based metrics
        logger.info({ res }, 'Response sent')
      }
    } finally {
      performance.mark(endMark)
      performance.measure(entryName, startMark, endMark)
      performance.clearMarks()
      obs.disconnect()
    }
  }
}

export async function disabledHandler<R extends OdisRequest>(
  _: Request<{}, {}, R>,
  response: Response<OdisResponse<R>, Locals>
): Promise<void> {
  sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
}
