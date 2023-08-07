import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  ErrorType,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  PnpQuotaResponse,
  PnpQuotaResponseFailure,
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
const tracer = opentelemetry.trace.getTracer('signer-tracer')

export class PnpQuotaIO extends IO<PnpQuotaRequest> {
  readonly endpoint = SignerEndpoint.PNP_QUOTA

  constructor(
    readonly enabled: boolean,
    readonly shouldFailOpen: boolean,
    readonly fullNodeTimeoutMs: number,
    readonly fullNodeRetryCount: number,
    readonly fullNodeRetryDelayMs: number,
    readonly kit: ContractKit
  ) {
    super(enabled)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<PnpQuotaResponse>
  ): Promise<PnpSession<PnpQuotaRequest> | null> {
    return tracer.startActiveSpan('pnpQuotaIO - Init', async (span) => {
      const warnings: ErrorType[] = []
      if (!super.inputChecks(request, response)) {
        span.addEvent('Error calling inputChecks')
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: response.statusMessage,
        })
        span.end()
        return null
      }
      if (!(await this.authenticate(request, warnings, response.locals.logger))) {
        this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
        span.addEvent('Error calling authenticate')
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: response.statusMessage,
        })
        span.end()
        return null
      }
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
    return authenticateUser(
      request,
      this.kit,
      logger,
      this.shouldFailOpen,
      warnings,
      this.fullNodeTimeoutMs,
      this.fullNodeRetryCount,
      this.fullNodeRetryDelayMs
    )
  }

  sendSuccess(
    status: number,
    response: Response<PnpQuotaResponseSuccess>,
    quotaStatus: PnpQuotaStatus,
    warnings: string[]
  ) {
    tracer.startActiveSpan(`pnpQuotaIO - sendSuccess`, (span) => {
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
      span.end()
    })
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  sendFailure(error: ErrorType, status: number, response: Response<PnpQuotaResponseFailure>) {
    tracer.startActiveSpan(`pnpQuotaIO - sendFailure`, (span) => {
      span.addEvent('Sending Failure')
      send(
        response,
        {
          success: false,
          version: getSignerVersion(),
          error,
        },
        status,
        response.locals.logger
      )
      span.setAttribute(SemanticAttributes.HTTP_METHOD, status)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error,
      })
      span.end()
    })
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
