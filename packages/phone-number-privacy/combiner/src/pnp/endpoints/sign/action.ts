import {
  CombinerEndpoint,
  DataEncryptionKeyFetcher,
  ErrorMessage,
  ErrorType,
  getSignerEndpoint,
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
import { PromiseHandler } from '../../../common/handlers'
import { getKeyVersionInfo, requestHasSupportedKeyVersion, sendFailure } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { logPnpSignerResponseDiscrepancies } from '../../services/log-responses'
import { findCombinerQuotaState } from '../../services/threshold-state'
import { Knex } from 'knex'
import { authenticateUser } from '../../../utils/authentication'

import { storeRequest } from '../../../database/wrappers/request'

export function createPnpSignHandler(
  db: Knex,
  signers: Signer[],
  config: OdisConfig,
  dekFetcher: DataEncryptionKeyFetcher
): PromiseHandler<SignMessageRequest> {
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

    if (!(await authenticateUser(db, request, logger, dekFetcher))) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }
    const keyVersionInfo = getKeyVersionInfo(request, config, logger)
    const crypto = new BLSCryptographyClient(keyVersionInfo)

    const processResult = async (result: OdisResponse<SignMessageRequest>): Promise<boolean> => {
      assert(result.success)
      crypto.addSignature({ url: 'TODO: remove', signature: result.signature })
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
        // TODO (soloseng): store validated request
        const signMessageRequest: SignMessageRequest = request.body
        await storeRequest(
          db,
          signMessageRequest.account,
          signMessageRequest.blindedQueryPhoneNumber,
          combinedSignature
        )

        return send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            signature: combinedSignature,
            ...findCombinerQuotaState(keyVersionInfo, signerResponses, warnings),
            warnings,
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

    const errorCode = maxErrorCode ?? 500
    const error = errorCodeToError(errorCode)
    sendFailure(error, errorCode, response)
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
