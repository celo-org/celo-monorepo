import {
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponse,
  DomainSchema,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'

export class DomainDisableIO extends IO<DisableDomainRequest> {
  readonly endpoint = SignerEndpoint.DISABLE_DOMAIN

  init(request: Request<{}, {}, unknown>, response: Response<DisableDomainResponse>): boolean {
    return !!super.inputChecks(request, response)
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, DisableDomainRequest> {
    return disableDomainRequestSchema(DomainSchema).is(request.body)
  }
}
