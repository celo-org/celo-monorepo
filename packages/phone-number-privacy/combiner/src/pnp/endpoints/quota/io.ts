import { ContractKit } from '@celo/contractkit'
import {
  authenticateUser,
  CombinerEndpoint,
  DataEncryptionKeyFetcher,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  PnpQuotaResponse,
  PnpQuotaResponseSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { getKeyVersionInfo, IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'

export class PnpQuotaIO extends IO<PnpQuotaRequest> {
  readonly requestSchema: t.Type<PnpQuotaRequest, PnpQuotaRequest, unknown> = PnpQuotaRequestSchema
  readonly responseSchema: t.Type<PnpQuotaResponse, PnpQuotaResponse, unknown> =
    PnpQuotaResponseSchema

  constructor(
    config: OdisConfig,
    readonly kit: ContractKit,
    readonly dekFetcher: DataEncryptionKeyFetcher
  ) {
    super(config, CombinerEndpoint.PNP_QUOTA)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<PnpQuotaResponse>
  ): Promise<Session<PnpQuotaRequest> | null> {
    if (!this.validateClientRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return null
    }

    if (!(await authenticateUser(request, response.locals.logger, this.dekFetcher))) {
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
}
