import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CryptoSession } from '../../../common/crypto-session'
import { SignAction } from '../../../common/sign'

export class DomainSignAction extends SignAction<DomainRestrictedSignatureRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DOMAIN_SIGN
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)

  combine(session: CryptoSession<DomainRestrictedSignatureRequest>): void {
    // this.logResponseDiscrepancies(session)
    // TODO(2.0.0, logging) https://github.com/celo-org/celo-monorepo/issues/9793

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )

        return this.io.sendSuccess(
          200,
          session.response,
          combinedSignature,
          this.thresholdStateService.findThresholdDomainState(session)
        )
      } catch {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(session)
  }

  protected parseBlindedMessage(req: DomainRestrictedSignatureRequest): string {
    return req.blindedMessage
  }

  protected logResponseDiscrepancies(
    _session: CryptoSession<DomainRestrictedSignatureRequest>
  ): void {
    // TODO(2.0.0, logging)
    // (https://github.com/celo-org/celo-monorepo/issues/9793)
    throw new Error('Method not implemented.')
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
