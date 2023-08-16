import {
  DisableDomainRequest,
  disableDomainRequestSchema,
  DisableDomainResponse,
  DomainSchema,
  SignerEndpoint,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { sendFailure } from '../../../common/handler'
import { IO } from '../../../common/io'

export class DomainDisableIO extends IO<DisableDomainRequest> {
  readonly endpoint = SignerEndpoint.DISABLE_DOMAIN

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DisableDomainResponse>
  ): Promise<boolean> {
    // Input checks sends a response to the user internally.
    if (!super.inputChecks(request, response)) {
      return false
    }
    if (!verifyDisableDomainRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return false
    }
    return true
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, DisableDomainRequest> {
    return disableDomainRequestSchema(DomainSchema).is(request.body)
  }
}
