import {
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  ErrorType,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CryptoSession } from '../../../common/crypto-session'
import { SignAction } from '../../../common/sign'
import { DomainSignerResponseLogger } from '../../services/log-responses'

export class DomainSignAction extends SignAction<DomainRestrictedSignatureRequest> {
  readonly responseLogger = new DomainSignerResponseLogger()

  combine(session: CryptoSession<DomainRestrictedSignatureRequest>): void {
    this.responseLogger.logResponseDiscrepancies(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combineBlindedSignatureShares(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )

        return this.io.sendSuccess(
          200,
          session.response,
          combinedSignature,
          this.thresholdStateService.findThresholdDomainState(session)
        )
      } catch (err) {
        // May fail upon combining signatures if too many sigs are invalid
        session.logger.error('Combining signatures failed in combine')
        session.logger.error(err)
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(session)
  }

  protected parseBlindedMessage(req: DomainRestrictedSignatureRequest): string {
    return req.blindedMessage
  }

  protected errorCodeToError(errorCode: number): ErrorType {
    switch (errorCode) {
      case 429:
        return WarningMessage.EXCEEDED_QUOTA
      case 401:
        // Authentication is checked in the combiner, but invalid nonces are passed through
        return WarningMessage.INVALID_NONCE
      default:
        return ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
    }
  }
}
