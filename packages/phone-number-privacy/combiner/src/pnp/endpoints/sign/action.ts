import {
  ErrorMessage,
  ErrorType,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  SignMessageRequest,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CryptoSession } from '../../../common/crypto-session'
import { SignAction } from '../../../common/sign'

export class PnpSignAction extends SignAction<SignMessageRequest> {
  combine(session: CryptoSession<SignMessageRequest>): void {
    this.logResponseDiscrepancies(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )

        const pnpQuotaStatus = this.thresholdStateService.findCombinerQuotaState(session)
        return this.io.sendSuccess(
          200,
          session.response,
          combinedSignature,
          pnpQuotaStatus.performedQueryCount,
          pnpQuotaStatus.totalQuota,
          pnpQuotaStatus.blockNumber
        )
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
    // TODO: responses should all already be successes due to CombineAction receiveSuccess
    const responses = session.responses
      .filter((res) => res.res.success)
      .map((res) => res.res) as SignMessageResponseSuccess[]
    const values = session.responses
      .map(
        (response) =>
          response.res.success && {
            signer: response.url,
            blockNumber: response.res.blockNumber,
            totalQuota: response.res.totalQuota,
            performedQueryCount: response.res.performedQueryCount,
          }
      )
      .filter((val) => val)

    if (responses.length === 0) {
      return
    }
    const expectedRes = responses[0]
    responses.forEach((res) => {
      if (
        res.blockNumber &&
        expectedRes.blockNumber &&
        Math.abs(res.blockNumber - expectedRes.blockNumber) > MAX_BLOCK_DISCREPANCY_THRESHOLD
      ) {
        const blockValues = session.responses
          .map(
            (response) =>
              response.res.success && {
                signer: response.url,
                blockNumber: response.res.blockNumber,
                warnings: response.res.warnings,
              }
          )
          .filter((val) => val)
        session.logger.error({ blockValues }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
        return
      } else if (res.totalQuota !== expectedRes.totalQuota) {
        session.logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
        return
      } else if (
        res.performedQueryCount !== expectedRes.performedQueryCount ||
        res.warnings !== expectedRes.warnings
      ) {
        session.logger.debug({ values }, 'Discrepancies in signer quota responses')
        return
      }
    })
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
