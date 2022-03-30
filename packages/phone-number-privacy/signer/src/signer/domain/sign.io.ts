import {
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseFailure,
  DomainRestrictedSignatureResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorType,
  KEY_VERSION_HEADER,
  send,
  SignerEndpoint,
  verifyDomainRestrictedSignatureRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { Key } from '../../key-management/key-provider-base'
import { IOAbstract } from '../io.abstract'
import { DomainSession } from './session'

export class DomainSignIO extends IOAbstract<DomainRestrictedSignatureRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_SIGN

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DomainRestrictedSignatureResponse>
  ): Promise<DomainSession<DomainRestrictedSignatureRequest> | null> {
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!this.getRequestKeyVersion(request, response.locals.logger())) {
      this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
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
  ): request is Request<{}, {}, DomainRestrictedSignatureRequest> {
    return domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)
  }

  authenticate(request: Request<{}, {}, DomainRestrictedSignatureRequest>): Promise<boolean> {
    return Promise.resolve(verifyDomainRestrictedSignatureRequestAuthenticity(request.body))
  }

  sendSuccess(
    status: number,
    response: Response<DomainRestrictedSignatureResponseSuccess>,
    key: Key,
    signature: string,
    domainState: DomainState
  ) {
    response.set(KEY_VERSION_HEADER, key.version.toString())
    send(
      response,
      {
        success: true,
        version: getVersion(),
        signature,
        status: domainState,
      },
      status,
      response.locals.logger()
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  sendFailure(
    error: ErrorType,
    status: number,
    response: Response<DomainRestrictedSignatureResponseFailure>,
    domainState?: DomainState
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        status: domainState,
      },
      status,
      response.locals.logger()
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
