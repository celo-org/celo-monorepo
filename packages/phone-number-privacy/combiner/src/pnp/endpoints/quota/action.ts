import { ErrorMessage, PnpQuotaRequest } from '@celo/phone-number-privacy-common'
import { CombineAction } from '../../../common/combine'
import { IO, sendFailure } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'
import { PnpSignerResponseLogger } from '../../services/log-responses'
import { PnpThresholdStateService } from '../../services/threshold-state'

export class PnpQuotaAction extends CombineAction<PnpQuotaRequest> {
  readonly responseLogger: PnpSignerResponseLogger = new PnpSignerResponseLogger()

  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: PnpThresholdStateService<PnpQuotaRequest>,
    readonly io: IO<PnpQuotaRequest>
  ) {
    super(config, io)
  }

  async combine(session: Session<PnpQuotaRequest>): Promise<void> {
    this.responseLogger.logResponseDiscrepancies(session)
    this.responseLogger.logFailOpenResponses(session)

    const { threshold } = session.keyVersionInfo

    if (session.responses.length >= threshold) {
      try {
        const quotaStatus = this.thresholdStateService.findCombinerQuotaState(session)
        this.io.sendSuccess(200, session.response, quotaStatus, session.warnings)
        return
      } catch (err) {
        session.logger.error(err, 'Error combining signer quota status responses')
      }
    }
    sendFailure(
      ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      session.response
    )
  }
}
