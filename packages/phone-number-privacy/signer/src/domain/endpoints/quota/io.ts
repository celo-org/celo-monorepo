import {
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponse,
  DomainSchema,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { IO } from '../../../common/io'

export class DomainQuotaIO extends IO<DomainQuotaStatusRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_QUOTA_STATUS

  init(request: Request<{}, {}, unknown>, response: Response<DomainQuotaStatusResponse>): boolean {
    return !!super.inputChecks(request, response)
  }

  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
  }
}
