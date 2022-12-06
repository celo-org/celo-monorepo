import {
  ErrorMessage,
  PnpQuotaRequest,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Session } from '../../common/session'
import {
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  MAX_QUERY_COUNT_DISCREPANCY_THRESHOLD,
  MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD,
} from '../../config'

export class PnpSignerResponseLogger {
  logResponseDiscrepancies(session: Session<PnpQuotaRequest> | Session<SignMessageRequest>): void {
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
    session.responses.forEach((response) => {
      if (response.res.success) {
        const { version, performedQueryCount, totalQuota, blockNumber, warnings } = response.res
        parsedResponses.push({
          signerUrl: response.url,
          values: { version, performedQueryCount, totalQuota, blockNumber, warnings },
        })
      }
    })
    if (parsedResponses.length === 0) {
      session.logger.warn('No successful signer responses found!')
      return
    }

    // log all responses if we notice any discrepancies to aid with debugging
    const first = JSON.stringify(parsedResponses[0].values)
    for (let i = 1; i < parsedResponses.length; i++) {
      if (JSON.stringify(parsedResponses[i].values) !== first) {
        session.logger.warn({ parsedResponses }, WarningMessage.SIGNER_RESPONSE_DISCREPANCIES)
        session.warnings.push(WarningMessage.SIGNER_RESPONSE_DISCREPANCIES)
        break
      }
    }

    // blockNumber
    parsedResponses.forEach((res) => {
      if (res.values.blockNumber === undefined) {
        session.logger.warn(
          { signerUrl: res.signerUrl },
          'Signer responded with undefined blockNumber'
        )
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
      session.logger.error(
        { sortedByBlockNumber },
        WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS
      )
      session.warnings.push(WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
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
      session.logger.error(
        { sortedByTotalQuota },
        WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS
      )
      session.warnings.push(WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
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
      session.logger.error(
        { sortedByQueryCount },
        WarningMessage.INCONSISTENT_SIGNER_QUERY_MEASUREMENTS
      )
      session.warnings.push(WarningMessage.INCONSISTENT_SIGNER_QUERY_MEASUREMENTS)
    }
  }

  logFailOpenResponses(session: Session<PnpQuotaRequest> | Session<SignMessageRequest>): void {
    session.responses.forEach((response) => {
      if (response.res.success) {
        const { warnings } = response.res
        if (warnings) {
          warnings.forEach((warning) => {
            switch (warning) {
              case ErrorMessage.FAILING_OPEN:
              case ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA:
              case ErrorMessage.FAILURE_TO_GET_DEK:
                session.logger.error(
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
}
