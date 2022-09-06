import {
  ErrorMessage,
  ErrorType,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CryptoSession } from '../../../common/crypto-session'
import { SignAction } from '../../../common/sign'
import { PnpDiscrepanciesLogger } from '../../services/logDiscrepancies'

export class PnpSignAction extends SignAction<SignMessageRequest> {
  readonly discrepanyLogger: PnpDiscrepanciesLogger = new PnpDiscrepanciesLogger()

  combine(session: CryptoSession<SignMessageRequest>): void {
    this.discrepanyLogger.logResponseDiscrepancies(session)

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

  protected errorCodeToError(errorCode: number): ErrorType {
    switch (errorCode) {
      case 403:
        return WarningMessage.EXCEEDED_QUOTA
      default:
        return ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
    }
  }
}
