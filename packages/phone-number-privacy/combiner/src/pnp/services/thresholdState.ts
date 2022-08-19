import {
  PnpQuotaRequest,
  PnpQuotaResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Session } from '../../common/session'
import { OdisConfig } from '../../config'

export class CombinerThresholdStateService<R extends PnpQuotaRequest> {
  constructor(readonly config: OdisConfig) {}

  findCombinerQuotaState(session: Session<R>) {
    const signerResponses = session.responses
      .map((signerResponse) => signerResponse.res)
      .filter((res) => res.success) as PnpQuotaResponseSuccess[]

    const sortedResponses = signerResponses.sort(
      (a, b) => a.performedQueryCount - b.performedQueryCount
    )

    const threshold = this.config.keys.threshold
    if (signerResponses.length < threshold) {
      throw new Error('Insufficient number of successful signer responses')
    }

    sortedResponses.forEach((res) => {
      if (res.totalQuota != sortedResponses[0].totalQuota) {
        session.logger.error(WarningMessage.INCONSISTENT_TOTAL_QUOTA)
      }
    })

    const thresholdSigner = sortedResponses[threshold - 1]
    return {
      performedQueryCount: thresholdSigner.performedQueryCount,
      // TODO: address scenario where total quota is inconsistent between signers
      totalQuota: thresholdSigner.totalQuota,
      blockNumber: thresholdSigner.blockNumber,
    }
  }
}
