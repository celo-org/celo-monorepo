import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  domainQuotaStatusResponseSchema,
  DomainSchema,
  ErrorMessage,
  send,
  SequentialDelayDomainStateSchema,
  verifyDisableDomainRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { PromiseHandler } from '../../../common/handlers'
import { getKeyVersionInfo, sendFailure } from '../../../common/io'

import { getCombinerVersion, OdisConfig } from '../../../config'
import { logDomainResponsesDiscrepancies } from '../../services/log-responses'
import { findThresholdDomainState } from '../../services/threshold-state'

export function createDomainQuotaHandler(
  signers: Signer[],
  config: OdisConfig
): PromiseHandler<DomainQuotaStatusRequest> {
  const requestSchema = domainQuotaStatusRequestSchema(DomainSchema)
  const signerEndpoint = CombinerEndpoint.DOMAIN_QUOTA_STATUS
  return async (request, response) => {
    if (!requestSchema.is(request.body)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return
    }

    if (!verifyDisableDomainRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
    }

    const keyVersionInfo = getKeyVersionInfo(request, config, response.locals.logger)

    const { signerResponses, maxErrorCode } = await thresholdCallToSigners(
      response.locals.logger,
      signers,
      signerEndpoint,
      request,
      keyVersionInfo,
      null,
      config.odisServices.timeoutMilliSeconds,
      domainQuotaStatusResponseSchema(SequentialDelayDomainStateSchema)
    )

    logDomainResponsesDiscrepancies(response.locals.logger, signerResponses)
    if (signerResponses.length >= keyVersionInfo.threshold) {
      try {
        send(
          response,
          {
            success: true,
            version: getCombinerVersion(),
            status: findThresholdDomainState(keyVersionInfo, signerResponses, signers.length),
          },
          200,
          response.locals.logger
        )
        return
      } catch (err) {
        response.locals.logger.error(err, 'Error combining signer quota status responses')
      }
    }
    sendFailure(ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE, maxErrorCode ?? 500, response)
  }
}
