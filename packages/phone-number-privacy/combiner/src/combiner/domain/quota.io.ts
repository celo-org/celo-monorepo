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
import { VERSION } from '../../config'
import { IOAbstract } from '../io.abstract'
import { Session } from '../session'

export class DomainQuotaIO extends IOAbstract<DomainQuotaStatusRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DOMAIN_QUOTA_STATUS
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)

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
    return new Session(request, response, undefined)
  }

  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
  }

  authenticate(request: Request<{}, {}, DomainQuotaStatusRequest>): Promise<boolean> {
    return Promise.resolve(verifyDomainQuotaStatusRequestAuthenticity(request.body))
  }

  validateSignerResponse(
    data: string,
    url: string,
    session: Session<DomainQuotaStatusRequest>
  ): DomainQuotaStatusResponse {
    const res: unknown = JSON.parse(data)
    if (!domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema).is(res)) {
      // TODO(Alec): add error type for this
      const msg = `Signer request to ${url + this.signerEndpoint} returned malformed response`
      session.logger.error({ data, signer: url }, msg)
      throw new Error(msg)
    }
    return res
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
      response.locals.logger()
    )
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DomainQuotaStatusResponseFailure>,
    domainState?: DomainState
  ) {
    send(
      response,
      {
        success: false,
        version: VERSION,
        error,
        status: domainState,
      },
      status,
      response.locals.logger()
    )
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
