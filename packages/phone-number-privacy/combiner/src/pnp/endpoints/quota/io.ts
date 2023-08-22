import { ContractKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  PnpQuotaResponse,
  PnpQuotaResponseSchema,
  PnpQuotaResponseSuccess,
  PnpQuotaStatus,
  send,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { getKeyVersionInfo, IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { getCombinerVersion, OdisConfig } from '../../../config'

export class PnpQuotaIO extends IO<PnpQuotaRequest> {
  readonly requestSchema: t.Type<PnpQuotaRequest, PnpQuotaRequest, unknown> = PnpQuotaRequestSchema
  readonly responseSchema: t.Type<PnpQuotaResponse, PnpQuotaResponse, unknown> =
    PnpQuotaResponseSchema

  constructor(config: OdisConfig, readonly kit: ContractKit) {
    super(config, CombinerEndpoint.PNP_QUOTA)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<PnpQuotaResponse>
  ): Promise<Session<PnpQuotaRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!(await this.authenticate(request, response.locals.logger))) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    const keyVersionInfo = getKeyVersionInfo(request, this.config, response.locals.logger)
    return new Session(request, response, keyVersionInfo)
  }

  validateClientRequest(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, PnpQuotaRequest> {
    return (
      super.validateClientRequest(request) &&
      hasValidAccountParam(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(request: Request<{}, {}, PnpQuotaRequest>, logger: Logger): Promise<boolean> {
    logger.debug({ url: request.url }) // just for ts not to make a fuzz
    return Promise.resolve(true)
    // return authenticateUser(
    //   request,
    //   logger,
    //   newContractKitFetcher(
    //     this.kit,
    //     logger,
    //     this.config.fullNodeTimeoutMs,
    //     this.config.fullNodeRetryCount,
    //     this.config.fullNodeRetryDelayMs
    //   )
    // )
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
        version: getCombinerVersion(),
        ...quotaStatus,
        warnings,
      },
      status,
      response.locals.logger
    )
  }
}
