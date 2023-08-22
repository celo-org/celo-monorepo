import {
  ErrorMessage,
  ErrorType,
  OdisResponse,
  send,
  SignMessageRequest,
  SignMessageResponseSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { CryptoSession } from '../../../common/crypto-session'
import { Locals } from '../../../common/handlers'
import { IO, sendFailure } from '../../../common/io'
import { ThresholdStateService } from '../../../common/sign'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { PnpSignerResponseLogger } from '../../services/log-responses'

export class PnpSignAction {
  readonly responseLogger: PnpSignerResponseLogger = new PnpSignerResponseLogger()

  protected readonly signers: Signer[]
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: ThresholdStateService<SignMessageRequest>,
    readonly io: IO<SignMessageRequest>
  ) {
    this.signers = JSON.parse(config.odisServices.signers)
  }

  async perform(
    request: Request<{}, {}, SignMessageRequest>,
    response: Response<OdisResponse<SignMessageRequest>, Locals>,
    session: CryptoSession<SignMessageRequest>
  ) {
    const logger = response.locals.logger
    const processRequest = async (result: OdisResponse<SignMessageRequest>): Promise<boolean> => {
      session.crypto.addSignature({ url: 'TODO: remove', signature: result.signature })
      // const signatureAdditionStart = Date.now()

      // logger.info(
      //   {
      //     signer: url,
      //     hasSufficientSignatures: session.crypto.x(),
      //     additionLatency: Date.now() - signatureAdditionStart,
      //   },
      //   'Added signature'
      // )

      // Send response immediately once we cross threshold
      // BLS threshold signatures can be combined without all partial signatures
      if (session.crypto.hasSufficientSignatures()) {
        try {
          session.crypto.combineBlindedSignatureShares(request.body.blindedQueryPhoneNumber, logger)
          // Close outstanding requests
          return true
        } catch (err) {
          // One or more signatures failed verification and were discarded.
          logger.info('Error caught in receiveSuccess')
          logger.info(err)
          // Continue to collect signatures.
        }
      }
      return false
    }

    await thresholdCallToSigners(
      logger,
      this.signers,
      this.io.signerEndpoint,
      session,
      session.keyVersionInfo.keyVersion,
      this.config.odisServices.timeoutMilliSeconds,
      SignMessageResponseSchema,
      processRequest
    )

    this.responseLogger.logResponseDiscrepancies(session)
    this.responseLogger.logFailOpenResponses(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combineBlindedSignatureShares(
          session.request.body.blindedQueryPhoneNumber,
          logger
        )

        const quotaStatus = this.thresholdStateService.findCombinerQuotaState(session)
        return send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            signature: combinedSignature,
            ...quotaStatus,
            warnings: session.warnings,
          },
          200,
          logger
        )
      } catch (error) {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
        logger.error(error)
      }
    }

    const errorCode = session.getMajorityErrorCode() ?? 500
    const error = this.errorCodeToError(errorCode)
    sendFailure(error, errorCode, session.response)
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
