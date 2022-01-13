import { DomainRequest, SignerEndpoint as Endpoint } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { DomainState } from '../../database/models/domainState'

export interface IDomainAuthService {
  authCheck(domainRequest: DomainRequest, endpoint: Endpoint, logger: Logger): boolean
  nonceCheck(domainRequest: DomainRequest, domainState: DomainState, logger: Logger): boolean
}
