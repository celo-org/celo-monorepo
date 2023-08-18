import { timeout } from '@celo/base'
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
import * as client from 'prom-client'
import { getSignerVersion } from '../config'
import { OdisError } from './error'
import { Counters, newMeter } from './metrics'

const tracer = opentelemetry.trace.getTracer('signer-tracer')

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
      Counters.requests.labels(req.url).inc()
      await handler(req, res)
    } catch (err: any) {
      // Handle any errors that otherwise managed to escape the proper handlers
      const logger = res.locals.logger
      logger.error(ErrorMessage.CAUGHT_ERROR_IN_ENDPOINT_HANDLER)
      logger.error(err)
      Counters.errorsCaughtInEndpointHandler.inc()

      if (!res.headersSent) {
        if (err instanceof OdisError) {
          sendFailure(err.code, err.status, res)
        } else {
          sendFailure(ErrorMessage.UNKNOWN_ERROR, 500, res)
        }
      } else {
        // Getting to this error likely indicates that the `perform` process
        // does not terminate after sending a response, and then throws an error.
        logger.error(ErrorMessage.ERROR_AFTER_RESPONSE_SENT)
        Counters.errorsThrownAfterResponseSent.inc()
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
  return (req, res) => newMeter(histogram, req.url)(() => handler(req, res))
}

export function timeoutHandler<R extends OdisRequest>(
  timeoutMs: number,
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  // Unique error to be thrown on timeout
  const timeoutError = Symbol() // TODO (mcortesi) use Error type
  return async (request, response) => {
    try {
      await timeout(handler, [request, response], timeoutMs, timeoutError)
    } catch (err: any) {
      if (err === timeoutError) {
        Counters.timeouts.inc()
        sendFailure(ErrorMessage.TIMEOUT_FROM_SIGNER, 500, response)
      }
    }
  }
}

export function withEnableHandler<R extends OdisRequest>(
  enabled: boolean,
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  return async (req, res) => {
    if (enabled) {
      return handler(req, res)
    } else {
      sendFailure(WarningMessage.API_UNAVAILABLE, 503, res)
    }
  }
}

export async function disabledHandler<R extends OdisRequest>(
  _: Request<{}, {}, R>,
  response: Response<OdisResponse<R>, Locals>
): Promise<void> {
  sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
}

export function sendFailure(
  error: ErrorType,
  status: number,
  response: Response,
  body?: Record<any, any> // TODO remove any
) {
  send(
    response,
    {
      success: false,
      version: getSignerVersion(),
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
    Counters.responses.labels(req.url, result.status.toString()).inc()
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
      version: getSignerVersion(),
      error,
      ...quotaStatus,
    },
  }
}
