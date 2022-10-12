import { timeout } from '@celo/base'
import { domainHash, DomainQuotaStatusRequest } from '@celo/phone-number-privacy-common'
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

  public async perform(
    session: DomainSession<DomainQuotaStatusRequest>,
    timeoutError: symbol
  ): Promise<void> {
    const domain = session.request.body.domain
    session.logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain).toString('hex'),
    })
    const domainStateRecord = await timeout(
      () => this.quotaService.getQuotaStatus(session),
      [],
      this.config.timeout,
      timeoutError
    )
    this.io.sendSuccess(200, session.response, toSequentialDelayDomainState(domainStateRecord))
  }
}
