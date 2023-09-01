import {
  CombinerEndpoint,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  domainQuotaStatusResponseSchema,
  DomainSchema,
  ErrorMessage,
  getSignerEndpoint,
  send,
  SequentialDelayDomainStateSchema,
  verifyDomainQuotaStatusRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Signer, thresholdCallToSigners } from '../../../common/combine'
import { PromiseHandler } from '../../../common/handlers'
import { getKeyVersionInfo, sendFailure } from '../../../common/io'
import { getCombinerVersion, OdisConfig } from '../../../config'
import { logDomainResponseDiscrepancies } from '../../services/log-responses'
import { findThresholdDomainState } from '../../services/threshold-state'

export function createDomainQuotaHandler(
  signers: Signer[],
  config: OdisConfig
): PromiseHandler<DomainQuotaStatusRequest> {
  return async (request, response) => {
    if (!domainQuotaStatusRequestSchema(DomainSchema).is(request.body)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return
    }

    if (!verifyDomainQuotaStatusRequestAuthenticity(request.body)) {
      sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return
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
    sendFailure(ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE, maxErrorCode ?? 500, response)
  }
}
