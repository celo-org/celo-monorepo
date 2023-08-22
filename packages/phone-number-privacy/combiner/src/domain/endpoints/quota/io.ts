import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponse,
  domainQuotaStatusResponseSchema,
  DomainQuotaStatusResponseSuccess,
  DomainSchema,
  DomainState,
  OdisResponse,
  send,
  SequentialDelayDomainStateSchema,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { getKeyVersionInfo, IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { getCombinerVersion, OdisConfig } from '../../../config'

export class DomainQuotaIO extends IO<DomainQuotaStatusRequest> {
  readonly requestSchema: t.Type<DomainQuotaStatusRequest, DomainQuotaStatusRequest, unknown> =
    domainQuotaStatusRequestSchema(DomainSchema)
  readonly responseSchema: t.Type<DomainQuotaStatusResponse, DomainQuotaStatusResponse, unknown> =
    domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema)

  constructor(config: OdisConfig) {
    super(config, CombinerEndpoint.DOMAIN_QUOTA_STATUS)
  }

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<DomainQuotaStatusRequest>>
  ): Promise<Session<DomainQuotaStatusRequest> | null> {
    if (!this.validateClientRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return null
    }
    if (!verifyDomainQuotaStatusRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    const keyVersionInfo = getKeyVersionInfo(request, this.config, response.locals.logger)
    return new Session(request, response, keyVersionInfo)
  }

  sendSuccess(
    status: number,
    response: Response<DomainQuotaStatusResponseSuccess>,
    domainState: DomainState
  ) {
    send(
      response,
      {
        success: true,
        version: getCombinerVersion(),
        status: domainState,
      },
      status,
      response.locals.logger
    )
  }
}
