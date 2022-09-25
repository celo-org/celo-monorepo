import {
  domainHash,
  DomainQuotaStatusRequest,
  ErrorMessage,
} from '@celo/phone-number-privacy-common'
import { Action } from '../../../common/action'
import { toSequentialDelayDomainState } from '../../../common/database/models/domain-state'
import { SignerConfig } from '../../../config'
import { DomainQuotaService } from '../../services/quota'
import { DomainSession } from '../../session'
import { DomainQuotaIO } from './io'

export class DomainQuotaAction implements Action<DomainQuotaStatusRequest> {
  constructor(
    readonly config: SignerConfig,
    readonly quotaService: DomainQuotaService,
    readonly io: DomainQuotaIO
  ) {}

  public async perform(session: DomainSession<DomainQuotaStatusRequest>): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })
    try {
      const domainStateRecord = await this.quotaService.getQuotaStatus(session)
      this.io.sendSuccess(200, session.response, toSequentialDelayDomainState(domainStateRecord))
    } catch (error) {
      session.logger.error(error, 'Error while getting domain status')
      this.io.sendFailure(ErrorMessage.DATABASE_GET_FAILURE, 500, session.response)
    }
  }
}
