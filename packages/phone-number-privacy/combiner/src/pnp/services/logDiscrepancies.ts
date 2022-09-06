import {
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD,
  PnpQuotaRequest,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Session } from '../../common/session'

export class PnpDiscrepanciesLogger {
  constructor() {}

  logResponseDiscrepancies(session: Session<PnpQuotaRequest> | Session<SignMessageRequest>): void {
    // https://github.com/celo-org/celo-monorepo/issues/9826
    // TODO(2.0.0, logging): responses should all already be successes due to CombineAction receiveSuccess

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
      session.logger.warn('No succesful responses found!')
      return
    }

    // log all responses if we notice any discrepancies to aid with debugging
    const first = JSON.stringify(parsedResponses[0].values)
    for (let i = 1; i < parsedResponses.length; i++) {
      if (JSON.stringify(parsedResponses[i].values) !== first) {
        session.logger.warn({ parsedResponses }, 'Discrepancies detected in signer responses')
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
      !!sortedByBlockNumber.length &&
      sortedByBlockNumber[0].values.blockNumber! -
        sortedByBlockNumber[sortedByBlockNumber.length - 1].values.blockNumber! >
        MAX_BLOCK_DISCREPANCY_THRESHOLD
    ) {
      session.logger.error(
        { sortedDescByBlockNumber: sortedByBlockNumber },
        WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS
      )
    }

    // totalQuota
    const sortedByTotalQuota = parsedResponses.sort(
      (a, b) => a.values.totalQuota - b.values.totalQuota
    )
    if (
      sortedByTotalQuota[0].values.totalQuota -
        sortedByTotalQuota[sortedByTotalQuota.length - 1].values.totalQuota >
      MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD
    ) {
      session.logger.error(
        { sortedDescByTotalQuota: sortedByTotalQuota },
        WarningMessage.INCONSISTENT_TOTAL_QUOTA
      )
    }
  }
}
