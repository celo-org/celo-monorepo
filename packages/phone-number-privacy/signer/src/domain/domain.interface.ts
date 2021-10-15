import {
  DisableDomainRequest,
  DomainRestrictedSignatureRequest,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'

export interface IDomainService {
  handleDisableDomain(
    request: Request<{}, {}, DisableDomainRequest>,
    response: Response
  ): Promise<void>
  handleGetDomainStatus(
    request: Request<{}, {}, DomainRestrictedSignatureRequest>,
    response: Response
  ): Promise<void>
}
