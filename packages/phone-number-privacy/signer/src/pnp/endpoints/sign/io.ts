import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  AuthenticationMethod,
  ErrorType,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  PnpQuotaStatus,
  requestHasValidKeyVersion,
  send,
  SignerEndpoint,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'
import { Key } from '../../../common/key-management/key-provider-base'
import { Counters } from '../../../common/metrics'
import { getSignerVersion } from '../../../config'
import { PnpSession } from '../../session'

import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
const tracer = opentelemetry.trace.getTracer('signer-tracer')

export class PnpSignIO extends IO<SignMessageRequest> {
  readonly endpoint = SignerEndpoint.PNP_SIGN

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
    response: Response<SignMessageResponse>
  ): Promise<PnpSession<SignMessageRequest> | null> {
    return tracer.startActiveSpan('pnpSignIO - init', async (span) => {
      const logger = response.locals.logger
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
      span.addEvent('inputChecks OK, Calling requestHasValidKeyVersion')
      if (!requestHasValidKeyVersion(request, logger)) {
        span.addEvent('Error request has invalid key version.')
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: WarningMessage.INVALID_KEY_VERSION_REQUEST,
        })
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 400)
        this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
        span.end()
        return null
      }
      span.addEvent('requestHasValidKeyVersion OK, Calling authenticate')
      if (!(await this.authenticate(request, warnings, logger))) {
        span.addEvent('Error calling authenticate')
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: WarningMessage.UNAUTHENTICATED_USER,
        })
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 401)
        this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
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

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, SignMessageRequest> {
    return (
      SignMessageRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(
    request: Request<{}, {}, SignMessageRequest>,
    warnings: ErrorType[],
    logger: Logger
  ): Promise<boolean> {
    const authMethod = request.body.authenticationMethod

    if (authMethod && authMethod === AuthenticationMethod.WALLET_KEY) {
      Counters.requestsWithWalletAddress.inc()
    }

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
    response: Response<SignMessageResponseSuccess>,
    key: Key,
    signature: string,
    quotaStatus: PnpQuotaStatus,
    warnings: string[]
  ) {
    return tracer.startActiveSpan(`pnpSignIO - sendSuccess`, (span) => {
      span.addEvent('Sending Success')
      response.set(KEY_VERSION_HEADER, key.version.toString())
      send(
        response,
        {
          success: true,
          version: getSignerVersion(),
          signature,
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

  sendFailure(
    error: string,
    status: number,
    response: Response<SignMessageResponseFailure>,
    quotaStatus?: PnpQuotaStatus
  ) {
    return tracer.startActiveSpan(`pnpSignIO - sendFailure`, (span) => {
      span.addEvent('Sending Failure')
      send(
        response,
        {
          success: false,
          version: getSignerVersion(),
          error,
          ...quotaStatus,
        },
        status,
        response.locals.logger
      )
      span.setAttribute(SemanticAttributes.HTTP_METHOD, status)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error,
      })
      Counters.responses.labels(this.endpoint, status.toString()).inc()
      span.end()
    })
  }
}
