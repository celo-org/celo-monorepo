import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponse,
  DomainQuotaStatusResponseFailure,
  domainQuotaStatusResponseSchema,
  DomainQuotaStatusResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorType,
  getSignerEndpoint,
  OdisResponse,
  send,
  SequentialDelayDomainStateSchema,
  SignerEndpoint,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { VERSION } from '../../../config'

export class DomainQuotaIO extends IO<DomainQuotaStatusRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DOMAIN_QUOTA_STATUS
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)
  readonly requestSchema: t.Type<
    DomainQuotaStatusRequest,
    DomainQuotaStatusRequest,
    unknown
  > = domainQuotaStatusRequestSchema(DomainSchema)
  readonly responseSchema: t.Type<
    DomainQuotaStatusResponse,
    DomainQuotaStatusResponse,
    unknown
  > = domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema)

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<DomainQuotaStatusRequest>>
  ): Promise<Session<DomainQuotaStatusRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!(await this.authenticate(request))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new Session(request, response)
  }

  authenticate(request: Request<{}, {}, DomainQuotaStatusRequest>): Promise<boolean> {
    return Promise.resolve(verifyDomainQuotaStatusRequestAuthenticity(request.body))
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
        version: VERSION,
        status: domainState,
      },
      status,
      response.locals.logger
    )
  }

  sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DomainQuotaStatusResponseFailure>
  ) {
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
