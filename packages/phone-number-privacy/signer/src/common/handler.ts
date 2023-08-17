import { timeout } from '@celo/base'
import {
  ErrorMessage,
  ErrorType,
  FailureResponse,
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

export type PromiseHandler = (request: Request, res: Response) => Promise<void>

export function catchErrorHandler(handler: PromiseHandler): PromiseHandler {
  return async (req, res) => {
    try {
      Counters.requests.labels(req.url).inc()
      await handler(req, res)
    } catch (err: any) {
      // Handle any errors that otherwise managed to escape the proper handlers
      const logger: Logger = res.locals.logger
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

export function tracingHandler(handler: PromiseHandler): PromiseHandler {
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

export function meteringHandler(
  histogram: client.Histogram<string>,
  handler: PromiseHandler
): PromiseHandler {
  return (req, res) => newMeter(histogram, req.url)(() => handler(req, res))
}

export function timeoutHandler(timeoutMs: number, handler: PromiseHandler): PromiseHandler {
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

export function withEnableHandler(enabled: boolean, handler: PromiseHandler): PromiseHandler {
  return async (req, res) => {
    if (enabled) {
      return handler(req, res)
    } else {
      sendFailure(WarningMessage.API_UNAVAILABLE, 503, res)
    }
  }
}

export async function disabledHandler(_: Request, response: Response): Promise<void> {
  sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
}

export function sendFailure(
  error: ErrorType,
  status: number,
  response: Response,
  body?: Record<any, any>
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

export interface Result<A extends OdisResponse> {
  status: number
  body: A
}

export type ResultHandler<A extends OdisResponse> = (
  request: Request,
  res: Response<A>
) => Promise<Result<A>>

export function resultHandler<A extends OdisResponse>(
  resHandler: ResultHandler<A>
): PromiseHandler {
  return async (req, res) => {
    const result = await resHandler(req, res)
    send(res, result.body, result.status, res.locals.logger)
    Counters.responses.labels(req.url, result.status.toString()).inc()
  }
}

export function errorResult( // TODO add support for domains
  status: number,
  error: string,
  quotaStatus?: PnpQuotaStatus | { status: SequentialDelayDomainState }
): Result<FailureResponse> {
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
