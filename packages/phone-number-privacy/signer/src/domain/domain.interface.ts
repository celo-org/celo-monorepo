import { DisableDomainRequest } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'

export interface IDomainService {
  handleDisableDomain(
    request: Request<{}, {}, DisableDomainRequest>,
    response: Response
  ): Promise<void>
}
