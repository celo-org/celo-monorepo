import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestSchema,
  disableDomainResponseSchema,
  DomainSchema,
  ErrorMessage,
  getSignerEndpoint,
  SequentialDelayDomainStateSchema,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { errorResult, ResultHandler } from '../../../common/handlers'
import { getKeyVersionInfo } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { logDomainResponseDiscrepancies } from '../../services/log-responses'
import { findThresholdDomainState } from '../../services/threshold-state'

export function disableDomain(
  signers: Signer[],
  config: OdisConfig
): ResultHandler<DisableDomainRequest> {
  return async (request, response) => {
    if (!disableDomainRequestSchema(DomainSchema).is(request.body)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }

    if (!verifyDisableDomainRequestAuthenticity(request.body)) {
      return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
    }

    // TODO remove?
    const keyVersionInfo = getKeyVersionInfo(request, config, response.locals.logger)

    const { signerResponses, maxErrorCode } = await thresholdCallToSigners<DisableDomainRequest>(
      response.locals.logger,
      {
        signers,
        endpoint: getSignerEndpoint(CombinerEndpoint.DISABLE_DOMAIN),
        request,
        keyVersionInfo,
        requestTimeoutMS: config.odisServices.timeoutMilliSeconds,
        responseSchema: disableDomainResponseSchema(SequentialDelayDomainStateSchema),
        shouldCheckKeyVersion: false,
      }
    )

    logDomainResponseDiscrepancies(response.locals.logger, signerResponses)
    try {
      const disableDomainStatus = findThresholdDomainState(
        keyVersionInfo,
        signerResponses,
        signers.length
      )
      if (disableDomainStatus.disabled) {
        return {
          status: 200,
          body: {
            success: true,
            version: getCombinerVersion(),
            status: disableDomainStatus,
          },
        }
      }
    } catch (err) {
      response.locals.logger.error(
        { err },
        'Error combining signer disable domain status responses'
      )
    }

    return errorResult(maxErrorCode ?? 500, ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE)
  }
}
