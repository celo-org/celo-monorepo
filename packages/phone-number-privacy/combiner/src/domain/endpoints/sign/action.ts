import {
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureResponseSchema,
  ErrorMessage,
  ErrorType,
  OdisResponse,
  send,
  SequentialDelayDomainStateSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { CryptoSession } from '../../../common/crypto-session'
import { Locals } from '../../../common/handlers'
import { IO, sendFailure } from '../../../common/io'
import { ThresholdStateService } from '../../../common/sign'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { DomainSignerResponseLogger } from '../../services/log-responses'

export class DomainSignAction {
  readonly responseLogger = new DomainSignerResponseLogger()

  protected readonly signers: Signer[]
  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: ThresholdStateService<DomainRestrictedSignatureRequest>,
    readonly io: IO<DomainRestrictedSignatureRequest>
  ) {
    this.signers = JSON.parse(config.odisServices.signers)
  }

  async perform(
    _request: Request<{}, {}, DomainRestrictedSignatureRequest>,
    response: Response<OdisResponse<DomainRestrictedSignatureRequest>, Locals>,
    session: CryptoSession<DomainRestrictedSignatureRequest>
  ) {
    const processRequest = async (
      res: OdisResponse<DomainRestrictedSignatureRequest>
    ): Promise<boolean> => {
      session.crypto.addSignature({ url: 'TODO: remove', signature: res.signature })
      // const signatureAdditionStart = Date.now()

      // session.logger.info(
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
          session.crypto.combineBlindedSignatureShares(
            this.parseBlindedMessage(session.request.body),
            session.logger
          )
          // Close outstanding requests
          return true
        } catch (err) {
          // One or more signatures failed verification and were discarded.
          session.logger.info('Error caught in receiveSuccess')
          session.logger.info(err)
          // Continue to collect signatures.
        }
      }
      return false
    }

    await thresholdCallToSigners(
      response.locals.logger,
      this.signers,
      this.io.signerEndpoint,
      session,
      session.keyVersionInfo.keyVersion,
      this.config.odisServices.timeoutMilliSeconds,
      domainRestrictedSignatureResponseSchema(SequentialDelayDomainStateSchema),
      processRequest
    )

    this.responseLogger.logResponseDiscrepancies(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combineBlindedSignatureShares(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )

        return send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            signature: combinedSignature,
            status: this.thresholdStateService.findThresholdDomainState(session),
          },
          200,
          response.locals.logger
        )
      } catch (err) {
        // May fail upon combining signatures if too many sigs are invalid
        session.logger.error('Combining signatures failed in combine')
        session.logger.error(err)
        // Fallback to handleMissingSignatures
      }
    }

    const errorCode = session.getMajorityErrorCode() ?? 500
    const error = this.errorCodeToError(errorCode)
    sendFailure(error, errorCode, session.response)
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
