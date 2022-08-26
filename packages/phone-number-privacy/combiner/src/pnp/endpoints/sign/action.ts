import {
  ErrorMessage,
  ErrorType,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CryptoSession } from '../../../common/crypto-session'
import { IO } from '../../../common/io'
import { SignAction } from '../../../common/sign'
import { OdisConfig } from '../../../config'

export class PnpSignAction extends SignAction<SignMessageRequest> {
  constructor(readonly config: OdisConfig, readonly io: IO<SignMessageRequest>) {
    super(config, io)
  }

  combine(session: CryptoSession<SignMessageRequest>): void {
    this.logResponseDiscrepancies(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )
        return this.io.sendSuccess(200, session.response, combinedSignature)
      } catch (error) {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
        session.logger.error(error)
      }
    }

    this.handleMissingSignatures(session)
  }

  protected parseBlindedMessage(req: SignMessageRequest): string {
    return req.blindedQueryPhoneNumber
  }

  protected logResponseDiscrepancies(session: CryptoSession<SignMessageRequest>): void {
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

  protected errorCodeToError(errorCode: number): ErrorType {
    switch (errorCode) {
      case 403:
        return WarningMessage.EXCEEDED_QUOTA
      default:
        return ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
    }
  }
}
