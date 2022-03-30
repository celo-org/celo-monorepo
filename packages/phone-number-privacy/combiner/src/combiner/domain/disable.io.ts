import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponse,
  DisableDomainResponseFailure,
  DisableDomainResponseSchema,
  DisableDomainResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorType,
  getSignerEndpoint,
  send,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { VERSION } from '../../config'
import { IOAbstract } from '../io.abstract'
import { Session } from '../session'

export class DomainDisableIO extends IOAbstract<DisableDomainRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DISABLE_DOMAIN
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DisableDomainResponse>
  ): Promise<Session<DisableDomainRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!(await this.authenticate(request))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new Session(request, response, undefined)
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, DisableDomainRequest> {
    return disableDomainRequestSchema(DomainSchema).is(request.body)
  }

  authenticate(request: Request<{}, {}, DisableDomainRequest>): Promise<boolean> {
    return Promise.resolve(verifyDisableDomainRequestAuthenticity(request.body))
  }

  validateSignerResponse(
    data: string,
    url: string,
    session: Session<DisableDomainRequest>
  ): DisableDomainResponse {
    const res: unknown = JSON.parse(data)
    if (!DisableDomainResponseSchema.is(res)) {
      // TODO(Alec): add error type for this
      const msg = `Signer request to ${url}/${this.signerEndpoint} returned malformed response`
      session.logger.error({ data, signer: url }, msg)
      throw new Error(msg)
    }
    return res
  }

  sendSuccess(
    status: number,
    response: Response<DisableDomainResponseSuccess>,
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
    response: Response<DisableDomainResponseFailure>,
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
    // Counters.responses.labels(this.endpoint, status.toString()).inc() // TODO(Alec)
  }
}
