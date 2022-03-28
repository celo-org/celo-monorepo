import {
  domainHash,
  DomainQuotaStatusRequest,
  ErrorMessage,
  getCombinerEndpoint,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { Config } from '../../config'
import { IActionService } from '../action.interface'
import { DomainQuotaIO } from './quota.io'
import { DomainQuotaService } from './quota.service'
import { DomainSession } from './session'

export class DomainQuotaAction implements IActionService<DomainQuotaStatusRequest> {
  readonly endpoint = SignerEndpoint.DOMAIN_QUOTA_STATUS
  readonly combinerEndpoint = getCombinerEndpoint(this.endpoint)

  constructor(
    readonly config: Config,
    readonly quotaService: DomainQuotaService,
    readonly io: DomainQuotaIO
  ) {}

  public async perform(session: DomainSession<DomainQuotaStatusRequest>): Promise<void> {
    // TODO(Alec): factor this beginning part out
    const domain = session.request.body.domain
    session.logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })

    try {
      const domainStateRecord = await this.quotaService.getQuotaStatus(session)
      this.io.sendSuccess(200, session.response, domainStateRecord.toSequentialDelayDomainState())
    } catch (error) {
      session.logger.error('Error while getting domain status', error)
      this.io.sendFailure(ErrorMessage.DATABASE_GET_FAILURE, 500, session.response)
    }
  }
}
