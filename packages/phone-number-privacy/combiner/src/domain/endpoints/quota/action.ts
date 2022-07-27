import { DomainQuotaStatusRequest, ErrorMessage } from '@celo/phone-number-privacy-common'
import { CombineAction } from '../../../common/combine'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'
import { DomainThresholdStateService } from '../../services/thresholdState'

export class DomainQuotaAction extends CombineAction<DomainQuotaStatusRequest> {
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: DomainThresholdStateService<DomainQuotaStatusRequest>,
    readonly io: IO<DomainQuotaStatusRequest>
  ) {
    super(config, io)
  }

  async combine(session: Session<DomainQuotaStatusRequest>): Promise<void> {
    if (session.responses.length >= this.config.keys.threshold) {
      try {
        const domainQuotaStatus = this.thresholdStateService.findThresholdDomainState(session)
        this.io.sendSuccess(200, session.response, session.logger, domainQuotaStatus)
        return
      } catch (error) {
        session.logger.error({ error }, 'Error combining signer quota status responses')
      }
    }
    this.io.sendFailure(
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response,
      session.logger
    )
  }
}
