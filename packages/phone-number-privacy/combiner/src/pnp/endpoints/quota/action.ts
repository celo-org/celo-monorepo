import {
  authenticateUser,
  CombinerEndpoint,
  DataEncryptionKeyFetcher,
  ErrorMessage,
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
import { Session } from '../../../common/session'
import { getCombinerVersion, OdisConfig } from '../../../config'
import {
  logFailOpenResponses,
  logPnpSignerResponseDiscrepancies,
} from '../../services/log-responses'
import { findCombinerQuotaState } from '../../services/threshold-state'

export function createPnpQuotaHandler(
  signers: Signer[],
  config: OdisConfig,
  dekFetcher: DataEncryptionKeyFetcher
): PromiseHandler<PnpQuotaRequest> {
  const signerEndpoint = CombinerEndpoint.PNP_QUOTA

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
    const keyVersionInfo = getKeyVersionInfo(request, config, logger)
    const session = new Session(response, keyVersionInfo)

    await thresholdCallToSigners(
      logger,
      signers,
      signerEndpoint,
      request,
      keyVersionInfo,
      null,
      config.odisServices.timeoutMilliSeconds,
      PnpQuotaResponseSchema
    )

    session.warnings.push(...logPnpSignerResponseDiscrepancies(logger, session.responses))
    logFailOpenResponses(logger, session.responses)

    const { threshold } = session.keyVersionInfo

    if (session.responses.length >= threshold) {
      try {
        const quotaStatus = findCombinerQuotaState(session)
        send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            ...quotaStatus,
            warnings: session.warnings,
          },
          200,
          logger
        )

        return
      } catch (err) {
        logger.error(err, 'Error combining signer quota status responses')
      }
    }
    sendFailure(
      ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE,
      session.getMajorityErrorCode() ?? 500,
      response
    )
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
