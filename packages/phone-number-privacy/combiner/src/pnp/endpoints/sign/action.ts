import {
  authenticateUser,
  CombinerEndpoint,
  DataEncryptionKeyFetcher,
  ErrorMessage,
  ErrorType,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  isBodyReasonablySized,
  OdisResponse,
  send,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponseSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'

import { Request } from 'express'
import assert from 'node:assert'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { BLSCryptographyClient } from '../../../common/crypto-clients/bls-crypto-client'
import { CryptoSession } from '../../../common/crypto-session'
import { PromiseHandler } from '../../../common/handlers'
import { getKeyVersionInfo, requestHasSupportedKeyVersion, sendFailure } from '../../../common/io'
import { ThresholdStateService } from '../../../common/sign'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { PnpSignerResponseLogger } from '../../services/log-responses'

export function createPnpSignHandler(
  signers: Signer[],
  config: OdisConfig,
  thresholdStateService: ThresholdStateService<SignMessageRequest>,
  dekFetcher: DataEncryptionKeyFetcher
): PromiseHandler<SignMessageRequest> {
  const signerEndpoint = CombinerEndpoint.PNP_SIGN
  const responseLogger: PnpSignerResponseLogger = new PnpSignerResponseLogger()
  return async (request, response) => {
    const logger = response.locals.logger
    if (!validateRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return
    }

    if (!requestHasSupportedKeyVersion(request, config, response.locals.logger)) {
      sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return
    }

    if (!(await authenticateUser(request, logger, dekFetcher))) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }
    const keyVersionInfo = getKeyVersionInfo(request, config, logger)
    const session = new CryptoSession(
      request,
      response,
      keyVersionInfo,
      new BLSCryptographyClient(keyVersionInfo)
    )

    const processRequest = async (result: OdisResponse<SignMessageRequest>): Promise<boolean> => {
      assert(result.success)
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
      signers,
      signerEndpoint,
      request,
      session.keyVersionInfo,
      session.keyVersionInfo.keyVersion,
      config.odisServices.timeoutMilliSeconds,
      SignMessageResponseSchema,
      processRequest
    )

    responseLogger.logResponseDiscrepancies(session)
    responseLogger.logFailOpenResponses(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = session.crypto.combineBlindedSignatureShares(
          session.request.body.blindedQueryPhoneNumber,
          logger
        )

        const quotaStatus = thresholdStateService.findCombinerQuotaState(session)
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
    const error = errorCodeToError(errorCode)
    sendFailure(error, errorCode, session.response)
  }
}

function validateRequest(
  request: Request<{}, {}, unknown>
): request is Request<{}, {}, SignMessageRequest> {
  return (
    SignMessageRequestSchema.is(request.body) &&
    hasValidAccountParam(request.body) &&
    hasValidBlindedPhoneNumberParam(request.body) &&
    isBodyReasonablySized(request.body)
  )
}

function errorCodeToError(errorCode: number): ErrorType {
  switch (errorCode) {
    case 403:
      return WarningMessage.EXCEEDED_QUOTA
    default:
      return ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
  }
}
