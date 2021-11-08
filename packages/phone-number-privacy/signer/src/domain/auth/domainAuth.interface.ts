import { DomainRequest } from '@celo/phone-number-privacy-common'
import { Endpoints } from '../../server'

export interface IDomainAuthService {
  authCheck(domainRequest: DomainRequest, endpoint: Endpoints): boolean
}
