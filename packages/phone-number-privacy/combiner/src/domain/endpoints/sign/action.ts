import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
  MAX_TIMESTAMP_DISCREPANCY_THRESHOLD,
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
    session: CryptoSession<DomainRestrictedSignatureRequest>
  ): void {
    // only use responses that have the domain state
    const successes = session.responses.filter((signerResponse) => signerResponse.res.status)

    const numDisabled = successes.filter((ds) => ds.res.status!.disabled).length
    if (numDisabled > 0 && numDisabled < successes.length) {
      session.logger.error(WarningMessage.INCONSISTENT_SIGNER_DOMAIN_DISABLED_STATES)
      return
    }

    if (successes.length === 0) {
      return
    }
    const expectedStatus = successes[0].res.status!
    const values = successes.map((response) => {
      return {
        signer: response.url,
        status: response.res.status!,
      }
    })
    successes.forEach((signerResponse) => {
      const status = signerResponse.res.status!
      if (Math.abs(status.now - expectedStatus.now) > MAX_TIMESTAMP_DISCREPANCY_THRESHOLD) {
        session.logger.warn({ values }, 'Inconsistent signer domain server timestamps')
        return
      }
    })
    session.logger.debug({ values }, 'Sequential Delay domain state')
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
