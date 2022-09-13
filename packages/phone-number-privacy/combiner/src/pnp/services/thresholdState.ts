import {
  PnpQuotaRequest,
  PnpQuotaStatus,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { Session } from '../../common/session'
import { MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD, OdisConfig } from '../../config'

// TODO(2.0.0, testing): add unit tests for this and domains equivalent
// (https://github.com/celo-org/celo-monorepo/issues/9792)
export class PnpThresholdStateService<R extends PnpQuotaRequest | SignMessageRequest> {
  constructor(readonly config: OdisConfig) {}

  findCombinerQuotaState(session: Session<R>): PnpQuotaStatus {
    const signerResponses = session.responses
      .map((signerResponse) => signerResponse.res)
      .filter((res) => res.success) as PnpQuotaStatus[]
    const sortedResponses = signerResponses.sort(
      (a, b) => a.totalQuota - a.performedQueryCount - (b.totalQuota - b.performedQueryCount)
    )
    const threshold = this.config.keys.threshold

    const totalQuotaAvg =
      sortedResponses.reduce((a, b) => a.totalQuota + b.totalQuota) / sortedResponses.length
    const totalQuotaStDev = Math.sqrt(
      sortedResponses.map((r) => (r.totalQuota - totalQuotaAvg) ** 2).reduce((a, b) => a + b) /
        sortedResponses.length
    )
    if (totalQuotaStDev > MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD) {
      throw new Error('Signer total quota responses deviate too much to be combined')
    } else if (totalQuotaStDev > 0) {
      session.warnings.push(
        'Inconsistent signer total quota responses, using threshold signer as best guess'
      )
    }

    // TODO: currently this check is not needed, as checking for sufficient number of responses and
    // filtering for successes is already done in the action. Consider adding back in based on the
    // result of https://github.com/celo-org/celo-monorepo/issues/9826
    // if (signerResponses.length < threshold) {
    //   throw new Error('Insufficient number of successful signer responses')
    // }

    const thresholdSigner = sortedResponses[threshold - 1]
    return {
      performedQueryCount: thresholdSigner.performedQueryCount,
      totalQuota: thresholdSigner.totalQuota,
      blockNumber: thresholdSigner.blockNumber,
    }
  }
}
