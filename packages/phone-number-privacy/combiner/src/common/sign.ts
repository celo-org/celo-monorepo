import {
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  ErrorType,
  OdisResponse,
  responseHasExpectedKeyVersion,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
import { OdisConfig } from '../config'
import { DomainThresholdStateService } from '../domain/services/threshold-state'
import { PnpThresholdStateService } from '../pnp/services/threshold-state'
import { CombineAction } from './combine'
import { CryptoSession } from './crypto-session'
import { IO } from './io'

// prettier-ignore
export type OdisSignatureRequest =
  | SignMessageRequest
  | DomainRestrictedSignatureRequest

export type ThresholdStateService<R extends OdisSignatureRequest> = R extends SignMessageRequest
  ? PnpThresholdStateService<R>
  : never | R extends DomainRestrictedSignatureRequest
  ? DomainThresholdStateService<R>
  : never

// tslint:disable-next-line: max-classes-per-file
export abstract class SignAction<R extends OdisSignatureRequest> extends CombineAction<R> {
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: ThresholdStateService<R>,
    readonly io: IO<R>
  ) {
    super(config, io)
  }

  // Throws if response is not actually successful
  protected async receiveSuccess(
    signerResponse: FetchResponse,
    url: string,
    session: CryptoSession<R>
  ): Promise<OdisResponse<R>> {
    const { keyVersion } = session.keyVersionInfo

    // TODO(2.0.0, deployment) consider this while doing deployment. Signers should be updated before the combiner is
    if (!responseHasExpectedKeyVersion(signerResponse, keyVersion, session.logger)) {
      throw new Error(ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
    }

    const res = await super.receiveSuccess(signerResponse, url, session)

    if (res.success) {
      const signatureAdditionStart = Date.now()
      session.crypto.addSignature({ url, signature: res.signature })
      session.logger.info(
        {
          signer: url,
          hasSufficientSignatures: session.crypto.hasSufficientSignatures(),
          additionLatency: Date.now() - signatureAdditionStart,
        },
        'Added signature'
      )
      // Send response immediately once we cross threshold
      // BLS threshold signatures can be combined without all partial signatures
      if (session.crypto.hasSufficientSignatures()) {
        try {
          session.crypto.combineBlindedSignatureShares(
            this.parseBlindedMessage(session.request.body),
            session.logger
          )
          // Close outstanding requests
          session.abort.abort()
        } catch (err) {
          // One or more signatures failed verification and were discarded.
          session.logger.info('Error caught in receiveSuccess')
          session.logger.info(err)
          // Continue to collect signatures.
        }
      }
    }
    return res
  }

  protected handleMissingSignatures(session: CryptoSession<R>) {
    const errorCode = session.getMajorityErrorCode() ?? 500
    const error = this.errorCodeToError(errorCode)
    this.io.sendFailure(error, errorCode, session.response)
  }

  protected abstract errorCodeToError(errorCode: number): ErrorType

  protected abstract parseBlindedMessage(req: OdisSignatureRequest): string
}
