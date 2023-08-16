import {
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  DomainSchema,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'

export class DomainSignIO extends IO<DomainRestrictedSignatureRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_SIGN

  init(
    request: Request<{}, {}, unknown>,
    response: Response<DomainRestrictedSignatureResponse>
  ): boolean {
    return !!super.inputChecks(request, response)
  }

  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainRestrictedSignatureRequest> {
    return domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)
  }
}
