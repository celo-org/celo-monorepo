import {
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponse,
  DomainQuotaStatusResponseFailure,
  DomainQuotaStatusResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorType,
  send,
  SignerEndpoint,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'
import { Counters } from '../../../common/metrics'
import { getVersion } from '../../../config'
import { DomainSession } from '../../session'

export class DomainQuotaIO extends IO<DomainQuotaStatusRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_QUOTA_STATUS

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DomainQuotaStatusResponse>
  ): Promise<DomainSession<DomainQuotaStatusRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!(await this.authenticate(request))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new DomainSession(request, response)
  }

  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
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
        version: getVersion(),
        status: domainState,
      },
      status,
      response.locals.logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
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
        version: getVersion(),
        error,
      },
      status,
      response.locals.logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
