import {
  KeyVersionInfo,
  OdisRequest,
  PnpQuotaStatus,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { SignerResponse } from '../../common/io'
import { MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD } from '../../config'

export function findCombinerQuotaState<R extends OdisRequest>(
  keyVersionInfo: KeyVersionInfo,
  rawSignerResponses: Array<SignerResponse<R>>,
  warnings: string[]
): PnpQuotaStatus {
  const { threshold } = keyVersionInfo
  const signerResponses = rawSignerResponses
    .map((signerResponse) => signerResponse.res)
    .filter((res) => res.success) as PnpQuotaStatus[]
  const sortedResponses = signerResponses.sort(
    (a, b) => b.totalQuota - b.performedQueryCount - (a.totalQuota - a.performedQueryCount)
  )

  const totalQuotaAvg =
    sortedResponses.map((r) => r.totalQuota).reduce((a, b) => a + b) / sortedResponses.length
  const totalQuotaStDev = Math.sqrt(
    sortedResponses.map((r) => (r.totalQuota - totalQuotaAvg) ** 2).reduce((a, b) => a + b) /
      sortedResponses.length
  )
  if (totalQuotaStDev > MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD) {
    // TODO(2.0.0): add alerting for this
    throw new Error(WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
  } else if (totalQuotaStDev > 0) {
    warnings.push(
      WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS +
        ', using threshold signer as best guess'
    )
  }

  // TODO(2.0.0) currently this check is not needed, as checking for sufficient number of responses and
  // filtering for successes is already done in the action. Consider adding back in based on the
  // result of https://github.com/celo-org/celo-monorepo/issues/9826
  // if (signerResponses.length < threshold) {
  //   throw new Error('Insufficient number of successful signer responses')
  // }

  const thresholdSigner = sortedResponses[threshold - 1]
  return {
    performedQueryCount: thresholdSigner.performedQueryCount,
    totalQuota: thresholdSigner.totalQuota,
  }
}
