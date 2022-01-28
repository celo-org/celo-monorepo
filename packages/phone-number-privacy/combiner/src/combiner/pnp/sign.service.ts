import { MAX_BLOCK_DISCREPANCY_THRESHOLD, WarningMessage } from '@celo/phone-number-privacy-common'
import { SignService } from '../sign.service'

export class PnpSignService extends SignService {
  protected logResponseDiscrepancies(): void {
    // Only compare responses which have values for the quota fields
    const successes = this.responses.filter(
      (response) =>
        response.res &&
        response.res.performedQueryCount &&
        response.res.totalQuota &&
        response.res.blockNumber
    )

    if (successes.length === 0) {
      return
    }
    // Compare the first response to the rest of the responses
    const expectedQueryCount = successes[0].res.performedQueryCount
    const expectedTotalQuota = successes[0].res.totalQuota
    const expectedBlockNumber = successes[0].res.blockNumber!
    let discrepancyFound = false
    for (const resp of successes) {
      // Performed query count should never diverge; however the totalQuota may
      // diverge if the queried block number is different
      if (
        resp.res.performedQueryCount !== expectedQueryCount ||
        (resp.res.totalQuota !== expectedTotalQuota && resp.res.blockNumber === expectedBlockNumber)
      ) {
        const values = successes.map((response) => {
          return {
            signer: response.url,
            performedQueryCount: response.res.performedQueryCount,
            totalQuota: response.res.totalQuota,
          }
        })
        this.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
        discrepancyFound = true
      }
      if (Math.abs(resp.res.blockNumber! - expectedBlockNumber) > MAX_BLOCK_DISCREPANCY_THRESHOLD) {
        const values = successes.map((response) => {
          return {
            signer: response.url,
            blockNumber: response.res.blockNumber,
          }
        })
        this.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
        discrepancyFound = true
      }
      if (discrepancyFound) {
        return
      }
    }
  }
}
