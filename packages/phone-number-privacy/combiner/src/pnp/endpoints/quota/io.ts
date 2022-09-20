import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  CombinerEndpoint,
  ErrorType,
  getSignerEndpoint,
  hasValidAccountParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  PnpQuotaResponse,
  PnpQuotaResponseFailure,
  PnpQuotaResponseSchema,
  PnpQuotaResponseSuccess,
  send,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig, VERSION } from '../../../config'

export class PnpQuotaIO extends IO<PnpQuotaRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.PNP_QUOTA
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)
  readonly requestSchema: t.Type<PnpQuotaRequest, PnpQuotaRequest, unknown> = PnpQuotaRequestSchema
  readonly responseSchema: t.Type<
    PnpQuotaResponse,
    PnpQuotaResponse,
    unknown
  > = PnpQuotaResponseSchema

  constructor(readonly config: OdisConfig, readonly kit: ContractKit) {
    super(config)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<PnpQuotaResponse>
  ): Promise<Session<PnpQuotaRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!(await this.authenticate(request, response.locals.logger))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new Session(request, response)
  }

  validateClientRequest(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, PnpQuotaRequest> {
    return (
      super.validateClientRequest(request) &&
      hasValidAccountParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(request: Request<{}, {}, PnpQuotaRequest>, logger: Logger): Promise<boolean> {
    return authenticateUser(request, this.kit, logger, this.config.shouldFailOpen)
  }

  sendSuccess(
    status: number,
    response: Response<PnpQuotaResponseSuccess>,
    warnings: string[],
    performedQueryCount: number,
    totalQuota: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: true,
        version: VERSION,
        performedQueryCount,
        totalQuota,
        blockNumber,
        warnings,
      },
      status,
      response.locals.logger
    )
  }

  sendFailure(error: ErrorType, status: number, response: Response<PnpQuotaResponseFailure>) {
    send(
      response,
      {
        success: false,
        version: VERSION,
        error,
      },
      status,
      response.locals.logger
    )
  }
}
