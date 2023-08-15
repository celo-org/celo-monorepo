import {
  authenticateUser,
  DataEncryptionKeyFetcher,
  ErrorType,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  PnpQuotaResponse,
  PnpQuotaResponseSuccess,
  PnpQuotaStatus,
  send,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'
import { Counters } from '../../../common/metrics'
import { getSignerVersion } from '../../../config'
import { PnpSession } from '../../session'

import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { sendFailure } from '../../../common/handler'
const tracer = opentelemetry.trace.getTracer('signer-tracer')

export class PnpQuotaIO extends IO<PnpQuotaRequest> {
  readonly endpoint = SignerEndpoint.PNP_QUOTA

  constructor(
    readonly enabled: boolean,
    readonly shouldFailOpen: boolean,
    readonly dekFetcher: DataEncryptionKeyFetcher
  ) {
    super(enabled)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<PnpQuotaResponse>
  ): Promise<PnpSession<PnpQuotaRequest> | null> {
    return tracer.startActiveSpan('pnpQuotaIO - Init', async (span) => {
      const warnings: ErrorType[] = []
      span.addEvent('Calling inputChecks')
      if (!super.inputChecks(request, response)) {
        span.addEvent('Error calling inputChecks')
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: response.statusMessage,
        })
        span.end()
        return null
      }
      span.addEvent('inputChecks OK, Calling authenticate')
      if (!(await this.authenticate(request, warnings, response.locals.logger))) {
        span.addEvent('Error calling authenticate')
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: WarningMessage.UNAUTHENTICATED_USER,
        })
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 401)
        sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
        span.end()
        return null
      }
      span.addEvent('Authenticate OK, creating session')
      const session = new PnpSession(request, response)
      session.errors.push(...warnings)
      span.addEvent('Session created')
      span.setStatus({
        code: SpanStatusCode.OK,
        message: response.statusMessage,
      })
      span.end()
      return session
    })
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, PnpQuotaRequest> {
    return (
      PnpQuotaRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(
    request: Request<{}, {}, PnpQuotaRequest>,
    warnings: ErrorType[],
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, logger, this.dekFetcher, this.shouldFailOpen, warnings)
  }

  sendSuccess(
    status: number,
    response: Response<PnpQuotaResponseSuccess>,
    quotaStatus: PnpQuotaStatus,
    warnings: string[]
  ) {
    return tracer.startActiveSpan(`pnpQuotaIO - sendSuccess`, (span) => {
      span.addEvent('Sending Success')
      send(
        response,
        {
          success: true,
          version: getSignerVersion(),
          ...quotaStatus,
          warnings,
        },
        status,
        response.locals.logger
      )
      span.setAttribute(SemanticAttributes.HTTP_METHOD, status)
      span.setStatus({
        code: SpanStatusCode.OK,
        message: response.statusMessage,
      })
      Counters.responses.labels(this.endpoint, status.toString()).inc()
      span.end()
    })
  }
}

// function pnpQuotaResult(quotaStatus: PnpQuotaStatus, warnings: string[]) {
//   return {
//     ...quotaStatus,
//     warnings,
//   }
// }

// export function sendSuccess(status: number, response: Response, result?: Object) {
//   send(
//     response,
//     {
//       success: true,
//       version: getSignerVersion(),
//       ...result,
//     },
//     status,
//     response.locals.logger
//   )
// }
