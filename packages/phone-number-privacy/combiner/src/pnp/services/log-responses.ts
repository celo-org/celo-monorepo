import {
  ErrorMessage,
  PnpQuotaRequest,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { SignerResponse } from '../../common/io'

import {
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD,
  MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD,
} from '../../config'

export function logPnpSignerResponseDiscrepancies(
  logger: Logger,
  responses: Array<SignerResponse<PnpQuotaRequest | SignMessageRequest>>
): string[] {
  const warnings: string[] = []

  // TODO responses should all already be successes due to CombineAction receiveSuccess
  // https://github.com/celo-org/celo-monorepo/issues/9826

  const parsedResponses: Array<{
    signerUrl: string
    values: {
      version: string
      performedQueryCount: number
      totalQuota: number
      blockNumber?: number
      warnings?: string[]
    }
  }> = []
  responses.forEach((response) => {
    if (response.res.success) {
      const { version, performedQueryCount, totalQuota, warnings } = response.res
      parsedResponses.push({
        signerUrl: response.url,
        values: { version, performedQueryCount, totalQuota, warnings },
      })
    }
  })
  if (parsedResponses.length === 0) {
    logger.warn('No successful signer responses found!')
    return warnings
  }

  // log all responses if we notice any discrepancies to aid with debugging
  const first = JSON.stringify(parsedResponses[0].values)
  for (let i = 1; i < parsedResponses.length; i++) {
    if (JSON.stringify(parsedResponses[i].values) !== first) {
      logger.warn({ parsedResponses }, WarningMessage.SIGNER_RESPONSE_DISCREPANCIES)
      warnings.push(WarningMessage.SIGNER_RESPONSE_DISCREPANCIES)
      break
    }
  }

  // blockNumber
  parsedResponses.forEach((res) => {
    if (res.values.blockNumber === undefined) {
      logger.warn({ signerUrl: res.signerUrl }, 'Signer responded with undefined blockNumber')
    }
  })
  const sortedByBlockNumber = parsedResponses
    .filter((res) => !!res.values.blockNumber)
    .sort((a, b) => a.values.blockNumber! - b.values.blockNumber!)
  if (
    sortedByBlockNumber.length &&
    sortedByBlockNumber[sortedByBlockNumber.length - 1].values.blockNumber! -
      sortedByBlockNumber[0].values.blockNumber! >=
      MAX_BLOCK_DISCREPANCY_THRESHOLD
  ) {
    logger.error({ sortedByBlockNumber }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
    warnings.push(WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
  }

  // totalQuota
  const sortedByTotalQuota = parsedResponses.sort(
    (a, b) => a.values.totalQuota - b.values.totalQuota
  )
  if (
    sortedByTotalQuota[sortedByTotalQuota.length - 1].values.totalQuota -
      sortedByTotalQuota[0].values.totalQuota >=
    MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD
  ) {
    logger.error({ sortedByTotalQuota }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
    warnings.push(WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
  }

  // performedQueryCount
  const sortedByQueryCount = parsedResponses.sort(
    (a, b) => a.values.performedQueryCount - b.values.performedQueryCount
  )
  if (
    sortedByQueryCount[sortedByQueryCount.length - 1].values.performedQueryCount -
      sortedByQueryCount[0].values.performedQueryCount >=
    MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD
  ) {
    logger.error({ sortedByQueryCount }, WarningMessage.INCONSISTENT_SIGNER_QUERY_MEASUREMENTS)
    warnings.push(WarningMessage.INCONSISTENT_SIGNER_QUERY_MEASUREMENTS)
  }

  return warnings
}

export function logFailOpenResponses(
  logger: Logger,
  responses: Array<SignerResponse<PnpQuotaRequest | SignMessageRequest>>
): void {
  responses.forEach((response) => {
    if (response.res.success) {
      const { warnings } = response.res
      if (warnings) {
        warnings.forEach((warning) => {
          switch (warning) {
            case ErrorMessage.FAILING_OPEN:
            case ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA:
            case ErrorMessage.FAILURE_TO_GET_DEK:
              logger.error(
                { signerWarning: warning, service: response.url },
                WarningMessage.SIGNER_FAILED_OPEN
              )
            default:
              break
          }
        })
      }
    }
  })
}
