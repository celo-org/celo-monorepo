import { DomainRequestBody } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'

export interface IDomainService {
  handleDisableDomain(
    request: Request<{}, {}, DomainRequestBody>,
    response: Response
  ): Promise<void>
  handleGetDomainStatus(
    request: Request<{}, {}, DomainRequestBody>,
    response: Response
  ): Promise<void>
}
