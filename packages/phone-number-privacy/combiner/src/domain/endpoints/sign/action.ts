import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  domainRestrictedSignatureResponseSchema,
  DomainSchema,
  ErrorMessage,
  ErrorType,
  OdisResponse,
  send,
  SequentialDelayDomainStateSchema,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import assert from 'node:assert'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { DomainCryptoClient } from '../../../common/crypto-clients/domain-crypto-client'
import { CryptoSession } from '../../../common/crypto-session'
import { PromiseHandler } from '../../../common/handlers'
import { getKeyVersionInfo, requestHasSupportedKeyVersion, sendFailure } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { logDomainResponsesDiscrepancies } from '../../services/log-responses'
import { findThresholdDomainState } from '../../services/threshold-state'

export function createDomainSignHandler(
  signers: Signer[],
  config: OdisConfig
): PromiseHandler<DomainRestrictedSignatureRequest> {
  const requestSchema = domainRestrictedSignatureRequestSchema(DomainSchema)
  const signerEndpoint = CombinerEndpoint.DOMAIN_SIGN
  return async (request, response) => {
    if (!requestSchema.is(request.body)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return
    }
    if (!requestHasSupportedKeyVersion(request, config, response.locals.logger)) {
      sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return
    }

    // Note that signing requests may include a nonce for replay protection that will be checked by
    // the signer, but is not checked here. As a result, requests that pass the authentication check
    // here may still fail when sent to the signer.
    if (!verifyDisableDomainRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }

    const keyVersionInfo = getKeyVersionInfo(request, config, response.locals.logger)
    const session = new CryptoSession(
      request,
      response,
      keyVersionInfo,
      new DomainCryptoClient(keyVersionInfo)
    )

    const logger = response.locals.logger
    const processRequest = async (
      res: OdisResponse<DomainRestrictedSignatureRequest>
    ): Promise<boolean> => {
      assert(res.success)
      session.crypto.addSignature({ url: 'TODO: remove', signature: res.signature })
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
          session.crypto.combineBlindedSignatureShares(request.body.blindedMessage, logger)
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
      response.locals.logger,
      signers,
      signerEndpoint,
      request,
      session.keyVersionInfo,
      session.keyVersionInfo.keyVersion,
      config.odisServices.timeoutMilliSeconds,
      domainRestrictedSignatureResponseSchema(SequentialDelayDomainStateSchema),
      processRequest
    )

    logDomainResponsesDiscrepancies(response.locals.logger, session.responses)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combineBlindedSignatureShares(
          request.body.blindedMessage,
          logger
        )

        return send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            signature: combinedSignature,
            status: findThresholdDomainState(session, signers.length),
          },
          200,
          response.locals.logger
        )
      } catch (err) {
        // May fail upon combining signatures if too many sigs are invalid
        logger.error('Combining signatures failed in combine')
        logger.error(err)
        // Fallback to handleMissingSignatures
      }
    }

    const errorCode = session.getMajorityErrorCode() ?? 500
    const error = errorCodeToError(errorCode)
    sendFailure(error, errorCode, session.response)
  }
}

function errorCodeToError(errorCode: number): ErrorType {
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
