import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import { MAX_BLOCK_DISCREPANCY_THRESHOLD, WarningMessage } from '@celo/phone-number-privacy-common'
import { Sign } from '../../../base/sign'
import { Session } from '../../../session'

export class PnpSignAction extends Sign<SignMessageRequest> {
  async combine(session: Session<SignMessageRequest>): Promise<void> {
    this.logResponseDiscrepancies(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = await session.crypto.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )
        return this.io.sendSuccess(200, session.response, session.logger, combinedSignature)
      } catch {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(session)
  }

  protected parseBlindedMessage(req: SignMessageRequest): string {
    return req.blindedQueryPhoneNumber
  }

  protected logResponseDiscrepancies(session: Session<SignMessageRequest>): void {
    // Only compare responses which have values for the quota fields
    const successes = session.responses.filter(
      (signerResponse) =>
        signerResponse.res &&
        signerResponse.res.performedQueryCount &&
        signerResponse.res.totalQuota &&
        signerResponse.res.blockNumber
    )

    if (successes.length === 0) {
      return
    }
    // Compare the first response to the rest of the responses
    const expectedQueryCount = successes[0].res.performedQueryCount
    const expectedTotalQuota = successes[0].res.totalQuota
    const expectedBlockNumber = successes[0].res.blockNumber!
    let discrepancyFound = false
    for (const signerResponse of successes) {
      // Performed query count should never diverge; however the totalQuota may
      // diverge if the queried block number is different
      if (
        signerResponse.res.performedQueryCount !== expectedQueryCount ||
        (signerResponse.res.totalQuota !== expectedTotalQuota &&
          signerResponse.res.blockNumber === expectedBlockNumber)
      ) {
        const values = successes.map((_signerResponse) => {
          return {
            signer: _signerResponse.url,
            performedQueryCount: _signerResponse.res.performedQueryCount,
            totalQuota: _signerResponse.res.totalQuota,
          }
        })
        session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
        discrepancyFound = true
      }
      if (
        Math.abs(signerResponse.res.blockNumber! - expectedBlockNumber) >
        MAX_BLOCK_DISCREPANCY_THRESHOLD
      ) {
        const values = successes.map((response) => {
          return {
            signer: response.url,
            blockNumber: response.res.blockNumber,
          }
        })
        session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
        discrepancyFound = true
      }
      if (discrepancyFound) {
        return
      }
    }
  }
}
