import { ErrorMessage, PnpQuotaRequest } from '@celo/phone-number-privacy-common'
import { CombineAction } from '../../../common/combine'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'
import { CombinerThresholdStateService } from '../../services/thresholdState'

export class PnpQuotaAction extends CombineAction<PnpQuotaRequest> {
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: CombinerThresholdStateService<PnpQuotaRequest>,
    readonly io: IO<PnpQuotaRequest>
  ) {
    super(config, io)
  }

  async combine(session: Session<PnpQuotaRequest>): Promise<void> {
    if (session.responses.length >= this.config.keys.threshold) {
      try {
        const {
          performedQueryCount,
          totalQuota,
          blockNumber,
        } = this.thresholdStateService.findCombinerQuotaState(session)
        this.io.sendSuccess(200, session.response, performedQueryCount, totalQuota, blockNumber)
        return
      } catch (error) {
        session.logger.error({ error }, 'Error combining signer quota status responses')
      }
    }
    this.io.sendFailure(
      ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response,
      session.logger
    )
  }
}
