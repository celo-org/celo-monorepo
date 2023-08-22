import { DomainQuotaStatusRequest, ErrorMessage } from '@celo/phone-number-privacy-common'
import { CombineAction } from '../../../common/combine'
import { IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'
import { DomainSignerResponseLogger } from '../../services/log-responses'
import { DomainThresholdStateService } from '../../services/threshold-state'

export class DomainQuotaAction extends CombineAction<DomainQuotaStatusRequest> {
  readonly responseLogger = new DomainSignerResponseLogger()

  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: DomainThresholdStateService<DomainQuotaStatusRequest>,
    readonly io: IO<DomainQuotaStatusRequest>
  ) {
    super(config, io)
  }

  combine(session: Session<DomainQuotaStatusRequest>): void {
    this.responseLogger.logResponseDiscrepancies(session)
    const { threshold } = session.keyVersionInfo
    if (session.responses.length >= threshold) {
      try {
        const domainQuotaStatus = this.thresholdStateService.findThresholdDomainState(session)
        this.io.sendSuccess(200, session.response, domainQuotaStatus)
        return
      } catch (err) {
        session.logger.error(err, 'Error combining signer quota status responses')
      }
    }
    sendFailure(
      ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response
    )
  }
}
