import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  domainQuotaStatusResponseSchema,
  DomainSchema,
  ErrorMessage,
  getSignerEndpoint,
  SequentialDelayDomainStateSchema,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { errorResult, ResultHandler } from '../../../common/handlers'
import { getKeyVersionInfo } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { logDomainResponseDiscrepancies } from '../../services/log-responses'
import { findThresholdDomainState } from '../../services/threshold-state'

export function domainQuota(
  signers: Signer[],
  config: OdisConfig
): ResultHandler<DomainQuotaStatusRequest> {
  return async (request, response) => {
    if (!domainQuotaStatusRequestSchema(DomainSchema).is(request.body)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }

    if (!verifyDomainQuotaStatusRequestAuthenticity(request.body)) {
      return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
    }

    // TODO remove?
    const keyVersionInfo = getKeyVersionInfo(request, config, response.locals.logger)

    const { signerResponses, maxErrorCode } = await thresholdCallToSigners(response.locals.logger, {
      signers,
      endpoint: getSignerEndpoint(CombinerEndpoint.DOMAIN_QUOTA_STATUS),
      request,
      keyVersionInfo,
      requestTimeoutMS: config.odisServices.timeoutMilliSeconds,
      responseSchema: domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema),
      shouldCheckKeyVersion: false,
    })

    logDomainResponseDiscrepancies(response.locals.logger, signerResponses)
    if (signerResponses.length >= keyVersionInfo.threshold) {
      try {
        return {
          status: 200,
          body: {
            success: true,
            version: getCombinerVersion(),
            status: findThresholdDomainState(keyVersionInfo, signerResponses, signers.length),
          },
        }
      } catch (err) {
        response.locals.logger.error(err, 'Error combining signer quota status responses')
      }
    }
    return errorResult(maxErrorCode ?? 500, ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE)
  }
}
