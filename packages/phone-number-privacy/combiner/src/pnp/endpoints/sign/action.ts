import {
  ErrorMessage,
  ErrorType,
  SignMessageRequest,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { CryptoSession } from '../../../common/crypto-session'

import { SignAction } from '../../../common/sign'
import {
  getCombinedSignatureIfRequestExists,
  storeRequest,
} from '../../../database/wrappers/request'
import { PnpSignerResponseLogger } from '../../services/log-responses'

export class PnpSignAction extends SignAction<SignMessageRequest> {
  readonly responseLogger: PnpSignerResponseLogger = new PnpSignerResponseLogger()

  async perform(session: CryptoSession<SignMessageRequest>) {
    //TODO (soloseng): check db for existing request and return combined signature if it exist.

    const signMessageRequest: SignMessageRequest = session.request.body
    const existingCombinedSignature = await getCombinedSignatureIfRequestExists(
      this.io.db!,
      signMessageRequest.account,
      signMessageRequest.blindedQueryPhoneNumber
    )
    if (existingCombinedSignature) {
      const quotaStatus = this.thresholdStateService.findCombinerQuotaState(session)

      // XXX (soloseng): should the session response be stored as well?
      //  session.responses.push({ url, res: signerResponse, status })

      return this.io.sendSuccess(
        200,
        session.response, //TODO (soloseng): should this be from the original response?
        existingCombinedSignature,
        quotaStatus,
        session.warnings
      )
    } else {
      await this.distribute(session)
      await this.combine(session)
    }
  }

  async combine(session: CryptoSession<SignMessageRequest>): Promise<void> {
    this.responseLogger.logResponseDiscrepancies(session)
    this.responseLogger.logFailOpenResponses(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combineBlindedSignatureShares(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )
        // TODO (soloseng): store validated request
        const signMessageRequest: SignMessageRequest = session.request.body
        await storeRequest(
          this.io.db!,
          signMessageRequest.account,
          signMessageRequest.blindedQueryPhoneNumber,
          combinedSignature
        )

        const quotaStatus = this.thresholdStateService.findCombinerQuotaState(session)
        return this.io.sendSuccess(
          200,
          session.response,
          combinedSignature,
          quotaStatus,
          session.warnings
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
