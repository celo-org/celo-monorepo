import { ErrorMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Counters, newMeter } from './metrics'
import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import * as client from 'prom-client'

const tracer = opentelemetry.trace.getTracer('signer-tracer')

export type PromiseHandler = (request: Request, res: Response) => Promise<void>

export function catchErrorHandler(handler: PromiseHandler): PromiseHandler {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err: any) {
      // Handle any errors that otherwise managed to escape the proper handlers
      const logger: Logger = res.locals.logger
      logger.error(ErrorMessage.CAUGHT_ERROR_IN_ENDPOINT_HANDLER)
      logger.error(err)
      Counters.errorsCaughtInEndpointHandler.inc()

      if (!res.headersSent) {
        logger.info('Responding with error in outer endpoint handler')
        res.status(500).json({
          success: false,
          error: ErrorMessage.UNKNOWN_ERROR,
        })
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
    return tracer.startActiveSpan('server - addEndpoint - post', async (parentSpan) => {
      try {
        parentSpan.addEvent('Called ' + req.path)
        parentSpan.setAttribute(SemanticAttributes.HTTP_ROUTE, req.path)
        parentSpan.setAttribute(SemanticAttributes.HTTP_METHOD, req.method)
        parentSpan.setAttribute(SemanticAttributes.HTTP_CLIENT_IP, req.ip)

        await handler(req, res)
      } catch (err: any) {
        parentSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Fail',
        })
        throw err
      } finally {
        parentSpan.end()
      }
    })
  }
}

export function meteringHandler(
  histogram: client.Histogram<string>,
  handler: PromiseHandler
): PromiseHandler {
  return (req, res) => newMeter(histogram, req.url)(() => handler(req, res))
}
