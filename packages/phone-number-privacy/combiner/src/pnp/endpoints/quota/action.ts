import {
  authenticateUser,
  CombinerEndpoint,
  DataEncryptionKeyFetcher,
  ErrorMessage,
  getSignerEndpoint,
  hasValidAccountParam,
  isBodyReasonablySized,
  PnpQuotaRequest,
  PnpQuotaRequestSchema,
  PnpQuotaResponseSchema,
  send,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { PromiseHandler } from '../../../common/handlers'
import { getKeyVersionInfo, sendFailure } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { logPnpSignerResponseDiscrepancies } from '../../services/log-responses'
import { findCombinerQuotaState } from '../../services/threshold-state'

export function createPnpQuotaHandler(
  signers: Signer[],
  config: OdisConfig,
  dekFetcher: DataEncryptionKeyFetcher
): PromiseHandler<PnpQuotaRequest> {
  return async (request, response) => {
    const logger = response.locals.logger

    if (!validateRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return
    }

    if (!(await authenticateUser(request, logger, dekFetcher))) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }

    // TODO remove this, we shouldn't need keyVersionInfo for non-signing endpoints
    const keyVersionInfo = getKeyVersionInfo(request, config, logger)

    const { signerResponses, maxErrorCode } = await thresholdCallToSigners(logger, {
      signers,
      endpoint: getSignerEndpoint(CombinerEndpoint.PNP_QUOTA),
      request,
      keyVersionInfo,
      requestTimeoutMS: config.odisServices.timeoutMilliSeconds,
      responseSchema: PnpQuotaResponseSchema,
      shouldCheckKeyVersion: false,
    })
    const warnings = logPnpSignerResponseDiscrepancies(logger, signerResponses)

    const { threshold } = keyVersionInfo

    if (signerResponses.length >= threshold) {
      try {
        const quotaStatus = findCombinerQuotaState(keyVersionInfo, signerResponses, warnings)
        send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            ...quotaStatus,
            warnings,
          },
          200,
          logger
        )

        return
      } catch (err) {
        logger.error(err, 'Error combining signer quota status responses')
      }
    }
    sendFailure(ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE, maxErrorCode ?? 500, response)
  }
}

function validateRequest(
  request: Request<{}, {}, unknown>
): request is Request<{}, {}, PnpQuotaRequest> {
  return (
    PnpQuotaRequestSchema.is(request.body) &&
    hasValidAccountParam(request.body) &&
    isBodyReasonablySized(request.body)
  )
}
