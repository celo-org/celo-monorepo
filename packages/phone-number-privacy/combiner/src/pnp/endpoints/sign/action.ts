import {
  authenticateUser,
  CombinerEndpoint,
  DataEncryptionKeyFetcher,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  isBodyReasonablySized,
  OdisResponse,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponseSchema,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import assert from 'node:assert'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { BLSCryptographyClient } from '../../../common/crypto-clients/bls-crypto-client'
import { errorResult, ResultHandler } from '../../../common/handlers'
import { getKeyVersionInfo, requestHasSupportedKeyVersion } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { logPnpSignerResponseDiscrepancies } from '../../services/log-responses'
import { findCombinerQuotaState } from '../../services/threshold-state'

export function pnpSign(
  signers: Signer[],
  config: OdisConfig,
  dekFetcher: DataEncryptionKeyFetcher
): ResultHandler<SignMessageRequest> {
  return async (request, response) => {
    const logger = response.locals.logger
    if (!isValidRequest(request)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }

    if (!requestHasSupportedKeyVersion(request, config, response.locals.logger)) {
      return errorResult(400, WarningMessage.INVALID_KEY_VERSION_REQUEST)
    }

    if (config.shouldAuthenticate) {
      if (!(await authenticateUser(request, logger, dekFetcher))) {
        return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
      }
    }

    const keyVersionInfo = getKeyVersionInfo(request, config, logger)
    const crypto = new BLSCryptographyClient(keyVersionInfo)

    const processResult = async (result: OdisResponse<SignMessageRequest>): Promise<boolean> => {
      assert(result.success)
      crypto.addSignature({ url: request.url, signature: result.signature })

      // Send response immediately once we cross threshold
      // BLS threshold signatures can be combined without all partial signatures
      if (crypto.hasSufficientSignatures()) {
        try {
          crypto.combineBlindedSignatureShares(request.body.blindedQueryPhoneNumber, logger)
          // Close outstanding requests
          return true
        } catch (err) {
          // One or more signatures failed verification and were discarded.
          logger.info('Error caught in processRequest')
          logger.info(err)
          // Continue to collect signatures.
        }
      }
      return false
    }

    const { signerResponses, maxErrorCode } = await thresholdCallToSigners(
      logger,
      {
        signers,
        endpoint: getSignerEndpoint(CombinerEndpoint.PNP_SIGN),
        request,
        keyVersionInfo,
        requestTimeoutMS: config.odisServices.timeoutMilliSeconds,
        responseSchema: SignMessageResponseSchema,
        shouldCheckKeyVersion: true,
      },
      processResult
    )

    const warnings = logPnpSignerResponseDiscrepancies(logger, signerResponses)

    if (crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = crypto.combineBlindedSignatureShares(
          request.body.blindedQueryPhoneNumber,
          logger
        )

        return {
          status: 200,
          body: {
            success: true,
            version: getCombinerVersion(),
            signature: combinedSignature,
            ...findCombinerQuotaState(keyVersionInfo, signerResponses, warnings),
            warnings,
          },
        }
      } catch (error) {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
        logger.error(error)
      }
    }

    const errorCode = maxErrorCode ?? 500
    const error = errorCodeToError(errorCode)
    return errorResult(errorCode, error)
  }
}

function isValidRequest(
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
