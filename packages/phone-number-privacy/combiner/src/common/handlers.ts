import {
  ErrorMessage,
  ErrorType,
  OdisRequest,
  OdisResponse,
  PnpQuotaStatus,
  send,
  SequentialDelayDomainState,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { performance, PerformanceObserver } from 'perf_hooks'
import * as client from 'prom-client'
import { getCombinerVersion } from '../config'
import { OdisError } from './error'
import { Counters, newMeter } from './metrics'

const tracer = opentelemetry.trace.getTracer('combiner-tracer')

export interface Locals {
  logger: Logger
}

export type PromiseHandler<R extends OdisRequest> = (
  request: Request<{}, {}, R>,
  res: Response<OdisResponse<R>, Locals>
) => Promise<void>

export function catchErrorHandler<R extends OdisRequest>(
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      const logger: Logger = res.locals.logger
      logger.error(ErrorMessage.CAUGHT_ERROR_IN_ENDPOINT_HANDLER)
      logger.error(err)
      Counters.errorsCaughtInEndpointHandler.labels(req.url).inc()
      if (!res.headersSent) {
        if (err instanceof OdisError) {
          sendFailure(err.code, err.status, res, req.url)
        } else {
          sendFailure(ErrorMessage.UNKNOWN_ERROR, 500, res, req.url)
        }
      } else {
        logger.error(ErrorMessage.ERROR_AFTER_RESPONSE_SENT)
      }
    }
  }
}

export function tracingHandler<R extends OdisRequest>(
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  return async (req, res) => {
    return tracer.startActiveSpan(
      req.url,
      {
        attributes: {
          [SemanticAttributes.HTTP_ROUTE]: req.path,
          [SemanticAttributes.HTTP_METHOD]: req.method,
          [SemanticAttributes.HTTP_CLIENT_IP]: req.ip,
        },
      },
      async (span) => {
        try {
          await handler(req, res)
          span.setStatus({
            code: SpanStatusCode.OK,
          })
        } catch (err: any) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err instanceof Error ? err.message : 'Fail',
          })
          throw err
        } finally {
          span.end()
        }
      }
    )
  }
}

export function meteringHandler<R extends OdisRequest>(
  histogram: client.Histogram<string>,
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  return async (req, res) =>
    newMeter(
      histogram,
      req.url
    )(async () => {
      const logger: Logger = res.locals.logger

      // used for log based metrics
      logger.info({ req: req.body }, 'Request received')

      const eventLoopLagMeasurementStart = Date.now()
      setTimeout(() => {
        const eventLoopLag = Date.now() - eventLoopLagMeasurementStart
        logger.info({ eventLoopLag }, 'Measure event loop lag')
      })
      // TODO:(soloseng): session ID may not always exist
      const startMark = `Begin ${req.url}/${req.body.sessionID}`
      const endMark = `End ${req.url}/${req.body.sessionID}`
      const entryName = `${req.url}/${req.body.sessionID} latency`

      const obs = new PerformanceObserver((list) => {
        const entry = list.getEntriesByName(entryName)[0]
        if (entry) {
          logger.info({ latency: entry }, 'e2e response latency measured')
        }
      })
      obs.observe({ entryTypes: ['measure'], buffered: false })

      performance.mark(startMark)

      try {
        Counters.requests.labels(req.url).inc()
        await handler(req, res)
        if (res.headersSent) {
          // used for log based metrics
          logger.info({ res }, 'Response sent')
          Counters.responses.labels(req.url, res.statusCode.toString()).inc()
        }
      } finally {
        performance.mark(endMark)
        performance.measure(entryName, startMark, endMark)

        performance.clearMeasures(entryName)
        performance.clearMarks(startMark)
        performance.clearMarks(endMark)
        obs.disconnect()
      }
    })
}

export function timeoutHandler<R extends OdisRequest>(
  timeoutMs: number,
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  return async (req, res) => {
    const timeoutSignal = (AbortSignal as any).timeout(timeoutMs)
    timeoutSignal.addEventListener(
      'abort',
      () => {
        if (!res.headersSent) {
          sendFailure(ErrorMessage.TIMEOUT_FROM_SIGNER, 500, res, req.url)
        }
      },
      { once: true }
    )

    await handler(req, res)
  }
}

export async function disabledHandler<R extends OdisRequest>(
  req: Request<{}, {}, R>,
  response: Response<OdisResponse<R>, Locals>
): Promise<void> {
  sendFailure(WarningMessage.API_UNAVAILABLE, 503, response, req.url)
}

export function sendFailure(
  error: ErrorType,
  status: number,
  response: Response,
  _endpoint: string,
  body?: Record<any, any> // TODO remove any
) {
  send(
    response,
    {
      success: false,
      version: getCombinerVersion(),
      error,
      ...body,
    },
    status,
    response.locals.logger
  )
}

export interface Result<R extends OdisRequest> {
  status: number
  body: OdisResponse<R>
}

export type ResultHandler<R extends OdisRequest> = (
  request: Request<{}, {}, R>,
  res: Response<OdisResponse<R>, Locals>
) => Promise<Result<R>>

export function resultHandler<R extends OdisRequest>(
  resHandler: ResultHandler<R>
): PromiseHandler<R> {
  return async (req, res) => {
    const result = await resHandler(req, res)
    send(res, result.body, result.status, res.locals.logger)
  }
}

export function errorResult(
  status: number,
  error: string,
  quotaStatus?: PnpQuotaStatus | { status: SequentialDelayDomainState }
): Result<any> {
  // TODO remove any
  return {
    status,
    body: {
      success: false,
      version: getCombinerVersion(),
      error,
      ...quotaStatus,
    },
  }
}
