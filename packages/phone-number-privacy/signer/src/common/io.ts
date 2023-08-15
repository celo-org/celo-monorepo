import {
  OdisRequest,
  OdisResponse,
  SignerEndpoint,
  SuccessResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Session } from './action'

import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { sendFailure } from './handler'
const tracer = opentelemetry.trace.getTracer('signer-tracer')

export abstract class IO<R extends OdisRequest> {
  abstract readonly endpoint: SignerEndpoint

  constructor(readonly enabled: boolean) {}

  abstract init(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<Session<R> | null>

  abstract validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, R>

  abstract authenticate(
    request: Request<{}, {}, R>,
    warnings?: string[],
    logger?: Logger
  ): Promise<boolean>

  abstract sendSuccess(
    status: number,
    response: Response<SuccessResponse<R>>,
    ...args: unknown[]
  ): void

  protected inputChecks(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): request is Request<{}, {}, R> {
    return tracer.startActiveSpan('CommonIO - inputChecks', (span) => {
      if (!this.enabled) {
        span.addEvent('Error calling enabled')
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: WarningMessage.API_UNAVAILABLE,
        })
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 503)
        sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
        span.end()
        return false
      }
      if (!this.validate(request)) {
        span.addEvent('Error calling validate')
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: WarningMessage.INVALID_INPUT,
        })
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 400)
        sendFailure(WarningMessage.INVALID_INPUT, 400, response)
        span.end()
        return false
      }
      span.addEvent('Correctly called inputChecks')
      span.setStatus({
        code: SpanStatusCode.OK,
        message: response.statusMessage,
      })
      span.end()
      return true
    })
  }
}
