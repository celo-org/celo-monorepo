import {
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse,
  ErrorMessage,
  ErrorType,
  OdisResponse,
  SignMessageRequest,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Response as FetchResponse } from 'node-fetch'
import { OdisConfig } from '../config'
import { CombineAction } from './combine'
import { IO } from './io'
import { Session } from './session'

// prettier-ignore
export type OdisSignatureRequest = SignMessageRequest | DomainRestrictedSignatureRequest
export type OdisSignatureResponse<R extends OdisSignatureRequest> = R extends SignMessageRequest
  ? SignMessageResponse
  : never | R extends DomainRestrictedSignatureRequest
  ? DomainRestrictedSignatureResponse
  : never

// tslint:disable-next-line: max-classes-per-file
export abstract class SignAction<R extends OdisSignatureRequest> extends CombineAction<R> {
  constructor(readonly config: OdisConfig, readonly io: IO<R>) {
    super(config, io)
  }

  // Throws if response is not actually successful
  protected async receiveSuccessResponse(
    signerResponse: FetchResponse,
    url: string,
    session: Session<R>
  ): Promise<OdisResponse<R>> {
    // Check key version header
    const responseKeyVersion = this.io.getResponseKeyVersion(signerResponse, session.logger)
    const requestKeyVersion =
      this.io.getRequestKeyVersion(session.request, session.logger) ?? this.config.keys.version
    if (responseKeyVersion !== requestKeyVersion) {
      throw new Error(ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
    }

    const res = await super.receiveSuccess(signerResponse, url, session)

    if (res.success) {
      // TODO figure out how to use types to make this check unneccesary
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
          await session.crypto.combinePartialBlindedSignatures(
            this.parseBlindedMessage(session.request.body)
          )
          // Close outstanding requests
          session.abort.abort()
        } catch {
          // One or more signatures failed verification and were discarded.
          // Error has already been logged, continue to collect signatures.
        }
      }
    }
    return res
  }

  protected handleMissingSignatures(session: Session<R>) {
    let error: ErrorType = ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
    const majorityErrorCode = session.getMajorityErrorCode()
    if (majorityErrorCode === 403 || majorityErrorCode === 429) {
      error = WarningMessage.EXCEEDED_QUOTA
    }
    this.io.sendFailure(error, majorityErrorCode ?? 500, session.response, session.logger)
  }

  protected abstract parseBlindedMessage(req: OdisSignatureRequest): string
}
