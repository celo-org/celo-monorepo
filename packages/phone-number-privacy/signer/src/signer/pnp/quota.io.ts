import {
  authenticateUser,
  ErrorType,
  hasValidAccountParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  PnpQuotaResponse,
  PnpQuotaResponseFailure,
  PnpQuotaResponseSuccess,
  send,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Config, getVersion } from '../../config'
import { getContractKit } from '../../web3/contracts'
import { IIOService } from '../io.interface'
import { PnpSession } from './session'

export class PnpQuotaIO implements IIOService<PnpQuotaRequest> {
  constructor(readonly config: Config) {}

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<PnpQuotaResponse>
  ): Promise<PnpSession<PnpQuotaRequest> | null> {
    if (!this.config.api.domains.enabled) {
      this.sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
      return null
    }
    if (!this.validate(request)) {
      this.sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return null
    }
    if (!(await this.authenticate(request, response.locals.logger()))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new PnpSession(request, response)
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, PnpQuotaRequest> {
    return (
      PnpQuotaRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(request: Request<{}, {}, PnpQuotaRequest>, logger: Logger): Promise<boolean> {
    return authenticateUser(request, getContractKit(), logger)
  }

  sendSuccess(
    status: number,
    response: Response<PnpQuotaResponseSuccess>,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: true,
        version: getVersion(),
        performedQueryCount,
        totalQuota,
        blockNumber,
      },
      status,
      response.locals.logger()
    )
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  sendFailure(
    error: ErrorType,
    status: number,
    response: Response<PnpQuotaResponseFailure>,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        performedQueryCount,
        totalQuota,
        blockNumber,
      },
      status,
      response.locals.logger()
    )
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
