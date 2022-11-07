import {
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponse,
  DisableDomainResponseFailure,
  DisableDomainResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorType,
  send,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'
import { Counters } from '../../../common/metrics'
import { getVersion } from '../../../config'
import { DomainSession } from '../../session'

export class DomainDisableIO extends IO<DisableDomainRequest> {
  readonly endpoint = SignerEndpoint.DISABLE_DOMAIN

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DisableDomainResponse>
  ): Promise<DomainSession<DisableDomainRequest> | null> {
    // Input checks sends a response to the user internally.
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!(await this.authenticate(request))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new DomainSession(request, response)
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, DisableDomainRequest> {
    return disableDomainRequestSchema(DomainSchema).is(request.body)
  }

  authenticate(request: Request<{}, {}, DisableDomainRequest>): Promise<boolean> {
    return Promise.resolve(verifyDisableDomainRequestAuthenticity(request.body))
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
        version: getVersion(),
        status: domainState,
      },
      status,
      response.locals.logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  sendFailure(error: ErrorType, status: number, response: Response<DisableDomainResponseFailure>) {
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
