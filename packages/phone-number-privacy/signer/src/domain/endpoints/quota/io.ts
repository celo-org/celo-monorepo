import {
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponse,
  DomainSchema,
  SignerEndpoint,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { sendFailure } from '../../../common/handler'
import { IO } from '../../../common/io'

export class DomainQuotaIO extends IO<DomainQuotaStatusRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_QUOTA_STATUS

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<DomainQuotaStatusResponse>
  ): Promise<boolean> {
    if (!super.inputChecks(request, response)) {
      return false
    }

    if (!verifyDomainQuotaStatusRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return false
    }
    return true
  }

  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
  }
}
