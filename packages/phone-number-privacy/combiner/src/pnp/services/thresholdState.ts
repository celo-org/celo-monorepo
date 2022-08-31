import {
  PnpQuotaRequest,
  PnpState,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Session } from '../../common/session'
import { OdisConfig } from '../../config'

// TODO(2.0.0, testing): add unit tests for this and domains equivalent
// (https://github.com/celo-org/celo-monorepo/issues/9792)
export class PnpThresholdStateService<R extends PnpQuotaRequest | SignMessageRequest> {
  constructor(readonly config: OdisConfig) {}

  findCombinerQuotaState(session: Session<R>): PnpState {
    const signerResponses = session.responses
      .map((signerResponse) => signerResponse.res)
      .filter((res) => res.success) as PnpState[]

    const sortedResponses = signerResponses.sort(
      (a, b) => a.performedQueryCount - b.performedQueryCount
    )

    const threshold = this.config.keys.threshold
    if (signerResponses.length < threshold) {
      throw new Error('Insufficient number of successful signer responses')
      // checking for sufficient number of responses is already done in the action
      // this is basically checking for sufficient number of successful responses
    }

    sortedResponses.forEach((res) => {
      if (res.totalQuota !== sortedResponses[0].totalQuota) {
        session.logger.error(WarningMessage.INCONSISTENT_TOTAL_QUOTA)
      }
    })

    const thresholdSigner = sortedResponses[threshold - 1]
    return {
      performedQueryCount: thresholdSigner.performedQueryCount,
      // TODO(2.0.0, refactor) address scenario where total quota is inconsistent between signers
      // (https://github.com/celo-org/celo-monorepo/issues/9806)
      totalQuota: thresholdSigner.totalQuota,
      blockNumber: thresholdSigner.blockNumber,
    }
  }
}
