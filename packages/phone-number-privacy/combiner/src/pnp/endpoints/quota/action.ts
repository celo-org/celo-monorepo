import { ErrorMessage, PnPQuotaRequest } from '@celo/phone-number-privacy-common'
import { CombineAction } from '../../../common/combine'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'
import { CombinerThresholdStateService } from '../../services/thresholdState'

export class PnPQuotaAction extends CombineAction<PnPQuotaRequest> {
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: CombinerThresholdStateService<PnPQuotaRequest>,
    readonly io: IO<PnPQuotaRequest>
  ) {
    super(config, io)
  }

  async combine(session: Session<PnPQuotaRequest>): Promise<void> {
    if (session.responses.length >= this.config.keys.threshold) {
      try {
        const quotaStatus = this.thresholdStateService.findCombinerQuotaState(session)
        this.io.sendSuccess(200, session.response, quotaStatus)
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
