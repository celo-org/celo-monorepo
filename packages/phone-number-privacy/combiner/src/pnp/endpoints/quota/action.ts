import {
  ErrorMessage,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  PnpQuotaRequest,
  PnpQuotaResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CombineAction } from '../../../common/combine'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { OdisConfig } from '../../../config'
import { PnpThresholdStateService } from '../../services/thresholdState'

export class PnpQuotaAction extends CombineAction<PnpQuotaRequest> {
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: PnpThresholdStateService<PnpQuotaRequest>,
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

  protected logResponseDiscrepancies(session: Session<PnpQuotaRequest>): void {
    // TODO: responses should all already be successes due to CombineAction receiveSuccess
    const responses = session.responses
      .filter((res) => res.res.success)
      .map((res) => res.res) as PnpQuotaResponseSuccess[]
    const values = session.responses
      .map(
        (response) =>
          response.res.success && {
            signer: response.url,
            blockNumber: response.res.blockNumber,
            totalQuota: response.res.totalQuota,
            performedQueryCount: response.res.performedQueryCount,
          }
      )
      .filter((val) => val)

    if (responses.length === 0) {
      return
    }
    const expectedRes = responses[0]
    responses.forEach((res) => {
      if (
        res.blockNumber &&
        expectedRes.blockNumber &&
        Math.abs(res.blockNumber - expectedRes.blockNumber) > MAX_BLOCK_DISCREPANCY_THRESHOLD
      ) {
        const blockValues = session.responses
          .map(
            (response) =>
              response.res.success && {
                signer: response.url,
                blockNumber: response.res.blockNumber,
                warnings: response.res.warnings,
              }
          )
          .filter((val) => val)
        session.logger.error({ blockValues }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
        return
      } else if (res.totalQuota !== expectedRes.totalQuota) {
        session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
        return
      } else if (
        res.performedQueryCount !== expectedRes.performedQueryCount ||
        res.warnings !== expectedRes.warnings
      ) {
        session.logger.warn({ values }, 'Discrepancies in signer quota responses')
        return
      }
    })
  }
}
