import { DomainRequest, SignerEndpoint as Endpoint } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { DomainStateRecord } from '../../database/models/domainState'

export interface IDomainAuthService {
  authCheck(domainRequest: DomainRequest, endpoint: Endpoint, logger: Logger): boolean
  nonceCheck(domainRequest: DomainRequest, domainState: DomainStateRecord, logger: Logger): boolean
}
