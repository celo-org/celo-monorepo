import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  domainRestrictedSignatureResponseSchema,
  DomainSchema,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
  OdisResponse,
  send,
  SequentialDelayDomainStateSchema,
  verifyDomainRestrictedSignatureRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import assert from 'node:assert'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { DomainCryptoClient } from '../../../common/crypto-clients/domain-crypto-client'
import { PromiseHandler } from '../../../common/handlers'
import { getKeyVersionInfo, requestHasSupportedKeyVersion, sendFailure } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { logDomainResponseDiscrepancies } from '../../services/log-responses'
import { findThresholdDomainState } from '../../services/threshold-state'

export function createDomainSignHandler(
  signers: Signer[],
  config: OdisConfig
): PromiseHandler<DomainRestrictedSignatureRequest> {
  return async (request, response) => {
    const { logger } = response.locals

    if (!domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return
    }
    if (!requestHasSupportedKeyVersion(request, config, logger)) {
      sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return
    }

    // Note that signing requests may include a nonce for replay protection that will be checked by
    // the signer, but is not checked here. As a result, requests that pass the authentication check
    // here may still fail when sent to the signer.
    if (!verifyDomainRestrictedSignatureRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }

    const keyVersionInfo = getKeyVersionInfo(request, config, logger)
    const crypto = new DomainCryptoClient(keyVersionInfo)

    const processResult = async (
      res: OdisResponse<DomainRestrictedSignatureRequest>
    ): Promise<boolean> => {
      assert(res.success)
      crypto.addSignature({ url: 'TODO: remove', signature: res.signature })
      // const signatureAdditionStart = Date.now()

      // logger.info(
      //   {
      //     signer: url,
      //     hasSufficientSignatures: crypto.x(),
      //     additionLatency: Date.now() - signatureAdditionStart,
      //   },
      //   'Added signature'
      // )

      // Send response immediately once we cross threshold
      // BLS threshold signatures can be combined without all partial signatures
      if (crypto.hasSufficientSignatures()) {
        try {
          crypto.combineBlindedSignatureShares(request.body.blindedMessage, logger)
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

    const { signerResponses, maxErrorCode } = await thresholdCallToSigners(
      response.locals.logger,
      {
        signers,
        endpoint: getSignerEndpoint(CombinerEndpoint.DOMAIN_SIGN),
        request,
        keyVersionInfo,
        requestTimeoutMS: config.odisServices.timeoutMilliSeconds,
        responseSchema: domainRestrictedSignatureResponseSchema(SequentialDelayDomainStateSchema),
        shouldCheckKeyVersion: true,
      },
      processResult
    )

    logDomainResponseDiscrepancies(response.locals.logger, signerResponses)

    if (crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = crypto.combineBlindedSignatureShares(
          request.body.blindedMessage,
          logger
        )

        return send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            signature: combinedSignature,
            status: findThresholdDomainState(keyVersionInfo, signerResponses, signers.length),
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

    const errorCode = maxErrorCode ?? 500
    const error = errorCodeToError(errorCode)
    sendFailure(error, errorCode, response)
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
