import {
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  DomainSchema,
  requestHasValidKeyVersion,
  SignerEndpoint,
  verifyDomainRestrictedSignatureRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { sendFailure } from '../../../common/handler'
import { IO } from '../../../common/io'

export class DomainSignIO extends IO<DomainRestrictedSignatureRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_SIGN

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DomainRestrictedSignatureResponse>
  ): Promise<boolean> {
    if (!super.inputChecks(request, response)) {
      return false
    }
    if (!requestHasValidKeyVersion(request, response.locals.logger)) {
      sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return false
    }
    if (!verifyDomainRestrictedSignatureRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return false
    }
    return true
  }

  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainRestrictedSignatureRequest> {
    return domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)
  }
}
