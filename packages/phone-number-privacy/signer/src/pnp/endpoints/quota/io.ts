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

export class PnpQuotaIO extends IO<PnpQuotaRequest> {
  readonly endpoint = SignerEndpoint.PNP_QUOTA

  constructor(
    readonly enabled: boolean,
    readonly shouldFailOpen: boolean,
    readonly timeoutMs: number,
    readonly kit: ContractKit
  ) {
    super(enabled)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<PnpQuotaResponse>
  ): Promise<PnpSession<PnpQuotaRequest> | null> {
    const warnings: ErrorType[] = []
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!(await this.authenticate(request, warnings, response.locals.logger))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    const session = new PnpSession(request, response)
    session.errors.push(...warnings)
    return session
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
      this.timeoutMs
    )
  }

  sendSuccess(
    status: number,
    response: Response<PnpQuotaResponseSuccess>,
    quotaStatus: PnpQuotaStatus,
    warnings: string[]
  ) {
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
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  sendFailure(error: ErrorType, status: number, response: Response<PnpQuotaResponseFailure>) {
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
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
