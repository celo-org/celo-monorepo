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
  verifyDomainRestrictedSignatureRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Config, getVersion } from '../../config'
import { Key } from '../../key-management/key-provider-base'
import { IIOService } from '../io.interface'
import { DomainSession } from './session'

export class DomainSignIO implements IIOService<DomainRestrictedSignatureRequest> {
  constructor(readonly config: Config) {}

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DomainRestrictedSignatureResponse>
  ): Promise<DomainSession<DomainRestrictedSignatureRequest> | null> {
    if (!this.config.api.domains.enabled) {
      this.sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
      return null
    }
    // if (this.getRequestKeyVersion(request, logger) ?? false) {
    //   this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
    //   return null
    // }
    if (!this.validate(request)) {
      this.sendFailure(WarningMessage.INVALID_INPUT, 400, response)
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
    // TODO(Alec): make sure this is happening everywhere it needs to
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
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
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
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
