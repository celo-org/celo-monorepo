import { DomainRequest } from '@celo/phone-number-privacy-common'
import { Endpoints } from '../../server'
import Logger from 'bunyan'

export interface IDomainAuthService {
  authCheck(domainRequest: DomainRequest, endpoint: Endpoints, logger: Logger): boolean
}
